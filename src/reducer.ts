import parseTime from "./parseTime";
import formatTime from "./formatTime";

export function newId() {
  return (Math.floor(Math.random() * 2**64)).toString(16).padStart(16, "0");
}

export interface Timer {
  id?: string;
  timeLimitMs?: number;
  timeRemainingMs?: number;
  isRunning?: boolean;
  lastUpdatedAt?: number;
  newTimeLimit?: string;
  newTimeRemaining?: string;
  confirmDelete?: boolean;
  deleted?: boolean;
  isNotifying?: boolean;
}

export interface NewTimerForm {
  newTime?: string;
}

export interface AppState {
  loaded?: boolean;
  timers?: Timer[];
  newTimerForm?: NewTimerForm;
}

export interface AppAction {
  setState?: AppState;
  updateAt?: number;
  setNewTimerText?: string;
  addTimerTop?: boolean;
  addTimer?: boolean;
  updateTimer?: {
    id?: string;
    newTimeLimit?: string;
    newTimeRemaining?: string;
    reset?: true;
    start?: true;
    pause?: true;
    delete?: true;
    lap?: true;
  };
  reorder?: string[];
}


export type AppDispatch = (action: AppAction) => void;



function getNewTimer(state: AppState): Timer {
  const timeLimitMs = parseTime(state?.newTimerForm?.newTime || "");
  return {
    id: newId(),
    newTimeLimit: state?.newTimerForm?.newTime,
    timeLimitMs: timeLimitMs,
    newTimeRemaining: state?.newTimerForm?.newTime,
    timeRemainingMs: timeLimitMs,
    isRunning: false,
    lastUpdatedAt: undefined,
  };
}

function updateTimerAt(timer: Timer, updateAt: number): Timer {
  if (!timer.isRunning || timer.timeRemainingMs === undefined) return timer;
  const previousTimeRemainingMs = timer.timeRemainingMs || 0;
  const nextTimeRemainingMs = previousTimeRemainingMs - (updateAt - (timer.lastUpdatedAt || updateAt));
  return {
    ...timer,
    timeRemainingMs: nextTimeRemainingMs,
    newTimeRemaining: formatTime(nextTimeRemainingMs),
    lastUpdatedAt: updateAt,
    isNotifying: timer.isRunning && (timer.timeLimitMs || 0) > 0 && nextTimeRemainingMs <= 0 && nextTimeRemainingMs > -1000,
  };
}



export function reducer(state: AppState, action: AppAction): AppState {
  if (action.setState !== undefined) {
    return action.setState;
  }
  if (action.setNewTimerText !== undefined) {
    return {
      ...state,
      newTimerForm: {
        newTime: action.setNewTimerText,
      },
    };
  }
  if (action.addTimerTop) {
    return {
      ...state,
      newTimerForm: {
        newTime: "",
      },
      timers: [
        getNewTimer(state),
        ...(state.timers || []),
      ],
    };
  }
  if (action.addTimer) {
    return {
      ...state,
      newTimerForm: {
        newTime: "",
      },
      timers: [
        ...state.timers || [],
        getNewTimer(state),
      ],
    };
  }
  if (action.updateAt) {
    return {
      ...state,
      timers: (state.timers || []).map((timer) => updateTimerAt(timer, action.updateAt!)),
    };
  }
  if (action.updateTimer) {
    return {
      ...state,
      timers: (state.timers || []).flatMap((timer) => {
        return (
          timer.id === action.updateTimer?.id ?
          [
            {
              ...timer,
              confirmDelete: false,
              ...(action.updateTimer?.newTimeLimit !== undefined ? {
                newTimeLimit: action.updateTimer?.newTimeLimit,
                timeLimitMs: parseTime(action.updateTimer?.newTimeLimit),
                timeRemainingMs: parseTime(action.updateTimer?.newTimeLimit),
                newTimeRemaining: formatTime(parseTime(action.updateTimer?.newTimeLimit)),
              } : {}),
              ...(action.updateTimer?.newTimeRemaining !== undefined ? {
                newTimeRemaining: action.updateTimer?.newTimeRemaining,
                timeRemainingMs: parseTime(action.updateTimer?.newTimeRemaining),
              } : {}),
              ...(action.updateTimer?.reset ? {
                timeRemainingMs: timer.timeLimitMs,
                newTimeRemaining: formatTime(timer.timeLimitMs || 0),
                isNotifying: false,
              } : {}),
              ...(action.updateTimer?.start ? {
                isRunning: true,
                lastUpdatedAt: undefined,
                isNotifying: false,
              } : {}),
              ...(action.updateTimer?.pause ? {
                isRunning: false,
                newTimeRemaining: formatTime(timer.timeRemainingMs || 0),
                isNotifying: false,
              } : {}),
              ...(action.updateTimer?.delete ? {
                confirmDelete: true,
                deleted: timer.confirmDelete
              } : {}),
              ...(action.updateTimer?.lap ? {
                isRunning: false,
              } : {}),
            },
            ...(action.updateTimer!.lap ? [
              {
                ...timer,
                id: newId(),
              }
            ] : []),
          ] : [timer]
        )
      }).filter(t => !t.deleted)
    };
  }
  if (action.reorder) {
    const timersById = (state?.timers || []).reduce((acc, timer) => {
      acc[timer.id!] = timer;
      return acc;
    }, {} as {[id: string]: Timer});
    return {
      ...state,
      timers: action.reorder.map((id) => timersById[id]),
    };
  }
  return state;
}