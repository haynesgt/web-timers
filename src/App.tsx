import { HTMLAttributes, TargetedEvent } from "preact/compat";
import { useEffect, useReducer } from "preact/hooks";
import parseTime from "./parseTime";
import formatTime from "./formatTime";

interface Timer {
  id?: string;
  timeLimitMs?: number;
  timeRemainingMs?: number;
  isStarted?: boolean;
  isRunning?: boolean;
  lastUpdatedAt?: number;
  newTimeLimit?: string;
  newTimeRemaining?: string;
  confirmDelete?: boolean;
  deleted?: boolean;
}

interface NewTimerForm {
  newTime?: string;
}

interface AppState {
  loaded?: boolean;
  timers?: Timer[];
  newTimerForm?: NewTimerForm;
}

interface AppAction {
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

function getNewTimer(state: AppState): Timer {
  const timeLimitMs = parseTime(state?.newTimerForm?.newTime || "");
  return {
    id: newId(),
    newTimeLimit: state?.newTimerForm?.newTime,
    timeLimitMs: timeLimitMs,
    newTimeRemaining: state?.newTimerForm?.newTime,
    timeRemainingMs: timeLimitMs,
    isStarted: false,
    isRunning: false,
    lastUpdatedAt: undefined,
  };
}

function updateTimerAt(timer: Timer, updateAt: number): Timer {
  if (!timer.isRunning || timer.timeRemainingMs === undefined) return timer;
  const timeRemainingMs = timer.timeRemainingMs - (updateAt - (timer.lastUpdatedAt || updateAt));
  return {
    ...timer,
    timeRemainingMs: timeRemainingMs,
    newTimeRemaining: formatTime(timeRemainingMs),
    lastUpdatedAt: updateAt,
  };
}

function reducer(state: AppState, action: AppAction): AppState {
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
      timers: (state.timers || []).flatMap((timer) => (
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
              isStarted: false,
            } : {}),
            ...(action.updateTimer?.start ? {
              isStarted: true,
              isRunning: true,
              timeRemainingMs: timer.isStarted ? timer.timeRemainingMs : timer.timeLimitMs,
              lastUpdatedAt: undefined,
            } : {}),
            ...(action.updateTimer?.pause ? {
              isRunning: false,
              newTimeRemaining: formatTime(timer.timeRemainingMs || 0),
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
      )).filter(t => !t.deleted)
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

type AppDispatch = (action: AppAction) => void;

type TimerRowProps = {
  state: AppState;
  timer: Timer;
  dispatch: AppDispatch;
};

Object.assign(window, {parseTime, formatTime});

function newId() {
  return (Math.floor(Math.random() * 2**64)).toString(16).padStart(16, "0");
}

function TimerRow({timer, dispatch, state}: TimerRowProps) {
  function onDragEnd(e: DragEvent) {
    let dest = document.elementFromPoint(e.clientX, e.clientY);
    let destId = dest?.getAttribute("data-timer-id");
    while (dest && destId === null) {
      dest = dest.parentElement;
      destId = dest?.getAttribute("data-timer-id");
    }
    if (!destId || destId === timer?.id) return;
    const before = e.clientY < dest!.getBoundingClientRect().top + dest!.getBoundingClientRect().height / 2;
    const timerIds = state.timers!.map((t) => t.id);
    let newOrder = timerIds.flatMap((id) => id === timer?.id ? [] : id == destId ? before ? [timer?.id, id] : [id, timer?.id] : [id]);
    dispatch({
      reorder: newOrder.filter((id) => id !== undefined) as string[],
    });

  }
  return (
    <tr className="timer-row" draggable={true} data-timer-id={timer?.id} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}>
      <td>
        {
          timer?.isStarted && timer?.isRunning ?
          timer?.newTimeLimit !== undefined ? timer?.newTimeLimit : formatTime(timer?.timeLimitMs || 0) :
            <LiveInput
              placeholder="0m0s"
              value={timer?.newTimeLimit !== undefined ? timer?.newTimeLimit : formatTime(timer?.timeLimitMs || 0)}
              setValue={(value) => dispatch?.({
                updateTimer: {
                  id: timer!.id!,
                  newTimeLimit: value,
                },
              })}
              />
        }
      </td>
      <td>
        {
          timer?.isRunning ?
            formatTime(timer?.timeRemainingMs || 0) :
            <LiveInput value={timer?.newTimeRemaining} setValue={(value) => dispatch?.({
              updateTimer: {
                id: timer!.id!,
                newTimeRemaining: value,
              },
            })} />
        }
      </td>
      <td>&nbsp;
        <TimerButtonGroup timer={timer} dispatch={dispatch} />
      </td>
    </tr>
  );
}

type TimerButtonGroupProps = {
  timer?: Timer;
  dispatch?: AppDispatch;
};

function TimerButtonGroup({timer, dispatch}: TimerButtonGroupProps) {
  function resetTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id || newId(),
        reset: true,
      },
    });
  }
  function startTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id || newId(),
        start: true,
      },
    });
  }
  function stopTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id || newId(),
        pause: true,
      },
    });
  }
  function lapTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id || newId(),
        lap: true,
      },
    });
  }
  function deleteTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id || newId(),
        delete: true,
      },
    });
  }

  return (
    <div className="button-group">
      <button onClick={resetTimer} disabled={!timer?.isRunning && !timer?.isStarted}>{"<<"}</button>
      <button onClick={stopTimer} disabled={!timer?.isRunning}>||</button>
      <button onClick={startTimer} disabled={timer?.isRunning}>&gt;</button>
      <button onClick={lapTimer} disabled={false}>v</button>
      <button onClick={deleteTimer} disabled={timer?.isRunning}>{timer?.confirmDelete ? "x!?" : "x"}</button>
    </div>
  );
}

function createDefaultState(): AppState {
  return {
    loaded: false,
    timers: [],
    newTimerForm: {
      newTime: "",
    },
  };
}

interface LiveInputProps extends HTMLAttributes<HTMLInputElement> {
  setValue?: (val: string) => void;
  onSubmit?: () => void;
};

function LiveInput({type, value, setValue, onSubmit, ...props}: LiveInputProps) {
  function onEvent(e: TargetedEvent<HTMLInputElement, KeyboardEvent & InputEvent>) {
    if (setValue) setValue(e?.currentTarget?.value || "");
    if (e.type == "keydown" && e?.key === "Enter" && onSubmit) onSubmit();
  }

  return (
    <input
      type={type || "text"}
      value={value}
      onInput={onEvent}
      onKeyUp={onEvent}
      onKeyDown={onEvent}
      {...props}
      />
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, {});
  // console.log(state);
  useEffect(() => {
    const savedState = localStorage.getItem("state");
    if (savedState) {
      dispatch({setState: JSON.parse(savedState)});
    } else {
      dispatch({setState: createDefaultState()});
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("state", JSON.stringify(state));
  }, [state]);
  useEffect(() => {
    let running = true;
    function update() {
      if (!running) return;
      dispatch({updateAt: Date.now()});
      requestAnimationFrame(update);
    }
    update();
    return () => {
      running = false;
    };
  });
  return (
    <div>
      <table className="timer-table">
          <tr>
            <th>Limit</th>
            <th>Remiaining</th>
            <th>Actions</th>
          </tr>
          {
            !state?.timers?.length ? <></> :
            <tr>
              <td colspan={3}>
                &nbsp;
                <div className="button-group">
                  <button onClick={() => dispatch({addTimerTop: true})}>+</button>
                </div>
              </td>
            </tr>
          }
          {
            state.timers?.map((timer) => {
              return (
                <TimerRow key={timer?.id} state={state} timer={timer} dispatch={dispatch} />
              );
            })
          }
          {
            /*
          <tr>
            <td>
              <LiveInput type="text" placeholder="Limit"
                value={state?.newTimerForm?.newTime || ""}
                setValue={(val) => dispatch({setNewTimerText: val})}
                onSubmit={() => dispatch({addTimer: true})}
                />
            </td>
            <td>
              {
                state?.newTimerForm?.newTime ?
                  formatTime(parseTime(state?.newTimerForm?.newTime)) :
                  <>e.g. 1d30m / 2:0.5</>
              }
            </td>
            <td>
              &nbsp;
              <div className="button-group">
                <button onClick={() => dispatch({addTimer: true})}>+</button>
              </div>
            </td>
          </tr>
          */
          }
          <tr>
            <td colspan={3}>
              &nbsp;
              <div className="button-group">
                <button onClick={() => dispatch({addTimer: true})}>+</button>
              </div>
            </td>
          </tr>
      </table>
    </div>
  );
}
