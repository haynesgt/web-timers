import { HTMLAttributes, TargetedEvent } from "preact/compat";
import { useEffect, useReducer, useRef } from "preact/hooks";
import formatTime from "./formatTime";

import { Timer, AppState, AppDispatch, reducer, newId, UpdateTimerAction } from "./reducer";
import { Alarm } from "./alarm";

function getAlarm() {
  if ("myAlarm" in window) return window.myAlarm as Alarm;
  const alarm = new Alarm();
  Object.assign(window, {myAlarm: alarm});
  return alarm;
}

window.addEventListener("mousedown", (e) => {
  getAlarm();
});


export type TimerRowProps = {
  state: AppState;
  timer: Timer;
  dispatch: AppDispatch;
};

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
    <tr className="timer-row" data-timer-id={timer?.id} onDragOver={(e) => e.preventDefault()}>
      <td>
        <div draggable={true}  onDragEnd={onDragEnd}>↕</div>
      </td>
      <td>
        {
          timer?.isRunning ?
          timer?.newTimeLimit !== undefined ? timer?.newTimeLimit : formatTime(timer?.timeLimitMs || 0) :
            <LiveInput
              placeholder={"0m0s"}
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
            <LiveInput value={timer?.newTimeRemaining || formatTime(timer?.timeRemainingMs || 0)} setValue={(value) => dispatch?.({
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

export type TimerButtonGroupProps = {
  timer?: Timer;
  dispatch?: AppDispatch;
};

function TimerButtonGroup({timer, dispatch}: TimerButtonGroupProps) {
  function action(action: UpdateTimerAction) {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        ...action
      },
    });
  }

  return (
    <div className="button-group">
      <button onClick={() => action({ reset: true })} disabled={timer?.timeLimitMs === timer?.timeRemainingMs}>{"<<"}</button>
      <button onClick={() => action({ addTime: { ms: 1000 * 60 } })}>+1m</button>
      <button onClick={() => action({ pause: true })} disabled={!timer?.isRunning}>||</button>
      <button onClick={() => action({ start: true })} disabled={timer?.isRunning}>&gt;</button>
      <button onClick={() => action({ lap: true })} disabled={false}>v</button>
      <button onClick={() => action({ delete: true })} disabled={false}>{timer?.confirmDelete ? "x!?" : "x"}</button>
    </div>
  );
}

function createDefaultState(): AppState {
  return {
    loaded: false,
    timers: [...[1, 60].flatMap(i => [1, 5, 10, 15, 30].map(j => i * j)), ...[1,3,6,12,24].map(i => i*3600)].map(i => i * 1000).map((i) => ({
      id: newId(),
      timeLimitMs: i,
      timeRemainingMs: i,
      isRunning: false,
      newTimeLimit: formatTime(i, {short: true}),
      newTimeRemaining: undefined,
      confirmDelete: false,
    })),
    newTimerForm: {
      newTime: "",
    },
  };
}

interface LiveInputProps {
  value?: string;
  setValue?: (val: string) => void;
  onSubmit?: () => void;
  [key: string]: any;
};

function LiveInput({value, setValue, onSubmit, ...props}: LiveInputProps) {
  function onEvent(e: TargetedEvent<HTMLInputElement, KeyboardEvent & InputEvent>) {
    if (setValue) setValue(e?.currentTarget?.value || "");
    if (e.type == "keydown" && e?.key === "Enter" && onSubmit) onSubmit();
  }

  return (
    <input
      type={"text"}
      value={value}
      onInput={onEvent}
      onKeyUp={onEvent}
      onKeyDown={onEvent}
      {...props}
      />
  );
}

class Notifier {
  notifyingStatusById = new Map<string, boolean>();

  setNotifying(id: string, notifying: boolean, message: string) {
    const wasNotifying = this.notifyingStatusById.get(id);
    if (wasNotifying === notifying) return;
    if (notifying) {
      new Notification(message);
      getAlarm().play();
    }
    this.notifyingStatusById.set(id, notifying);
  }
}
const notifier = new Notifier();

function setIcon(text: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = 40;
  canvas.height = 32;
  ctx.font = '24px Courier bold';
  // ctx.fontStretch = 'ultra-condensed';
  ctx.fillStyle = 'white';
  ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
  ctx.fill();
  ctx.fillStyle = 'black';
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, canvas.width / 2 - textWidth / 2, 24);
  const iconElement = document.querySelector("link[rel='icon']");
  if (iconElement) iconElement.remove();

  document.head.insertAdjacentHTML("beforeend", `<link rel="icon" href="${canvas.toDataURL('image/png')}">`);
}

Object.assign(window, {setIcon, formatTime});


const throttledSetIcon = (() => {
  let lastText = "";
  let lastTime = 0;
  return (text: string) => {
    const now = Date.now();
    if (text === lastText && now - lastTime < 1000) return;
    setIcon(text);
    lastText = text;
    lastTime = now;
  };
})();


export function AppHelp() {
  return <div>
    <p></p>
  </div>;
}

export default function TimerApp() {
  const [state, dispatch] = useReducer(reducer, {});
  Object.assign(window, {state, dispatch});
  useEffect(() => {
    // load saved state
    const savedState = localStorage.getItem("state");
    if (savedState) {
      dispatch({setState: JSON.parse(savedState)});
    } else {
      dispatch({setState: createDefaultState()});
    }
    Object.assign(window, {resetAllTimers: () => { dispatch({setState: createDefaultState()}); }})
  }, []);
  useEffect(() => {
    localStorage.setItem("state", JSON.stringify(state));
    // set window title
    const runningTimers = state.timers?.filter((timer) => timer.isRunning) || [];
    const minTimeRemainingMs =
      runningTimers.length === 0 ? undefined :
      Math.min(...runningTimers.filter((timer) => (timer.timeRemainingMs) || 0 > 0)?.map((timer) => timer.timeRemainingMs!));
    const title = runningTimers?.length ? formatTime(minTimeRemainingMs || 0, {short: true}) : "Timer";
    document.title = title;
    if (minTimeRemainingMs) {
      throttledSetIcon(formatTime(minTimeRemainingMs || 0, {short: "very"}));
    } else {
      throttledSetIcon("T");
    }
  }, [state]);
  useEffect(() => {
    let running = true;
    function update() {
      if (!running) return;
      dispatch({updateAt: Date.now()});
      setTimeout(update);
    }
    update();
    return () => {
      running = false;
    };
  });
  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        // if (permission === 'granted') {
        //   new Notification('Alerts will display here!');
        // }
      });
    }
  }, []);
  useEffect(() => {
    state.timers?.forEach((timer) => {
      if (timer) {
        notifier.setNotifying(timer.id!, timer.isNotifying || false, "Timer done: " + formatTime(timer.timeLimitMs || 0));
      }
    });
  }, [state]);
  return (
    <div>
      <table className="timer-table">
          <tr>
            <th></th>
            <th>Limit</th>
            <th>Remiaining</th>
            <th>Actions</th>
          </tr>
          {
            state.timers?.map((timer) => {
              return (
                <TimerRow key={timer?.id} state={state} timer={timer} dispatch={dispatch} />
              );
            })
          }
          <tr>
            <td colspan={4}>
              &nbsp;
              <div className="button-group">
                <button onClick={() => dispatch({addTimer: true})}>+</button>
              </div>
            </td>
          </tr>
      </table>
      <AppHelp/>
    </div>
  );
}
