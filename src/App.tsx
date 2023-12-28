import { HTMLAttributes, TargetedEvent } from "preact/compat";
import { useEffect, useReducer, useRef } from "preact/hooks";
import formatTime from "./formatTime";

import { Timer, AppState, AppDispatch, reducer, newId } from "./reducer";

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
    <tr className="timer-row" draggable={true} data-timer-id={timer?.id} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}>
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
  function resetTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        reset: true,
      },
    });
  }
  function startTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        start: true,
      },
    });
  }
  function stopTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        pause: true,
      },
    });
  }
  function lapTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        lap: true,
      },
    });
  }
  function deleteTimer() {
    dispatch?.({
      updateTimer: {
        id: timer?.id!,
        delete: true,
      },
    });
  }

  return (
    <div className="button-group">
      <button onClick={resetTimer} disabled={timer?.timeLimitMs === timer?.timeRemainingMs}>{"<<"}</button>
      <button onClick={stopTimer} disabled={!timer?.isRunning}>||</button>
      <button onClick={startTimer} disabled={timer?.isRunning}>&gt;</button>
      <button onClick={lapTimer} disabled={false}>v</button>
      <button onClick={deleteTimer} disabled={false}>{timer?.confirmDelete ? "x!?" : "x"}</button>
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
      newTimeLimit: undefined,
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

export default function App() {
  const [state, dispatch] = useReducer(reducer, {});
  Object.assign(window, {state, dispatch});
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
            state.timers?.map((timer) => {
              return (
                <TimerRow key={timer?.id} state={state} timer={timer} dispatch={dispatch} />
              );
            })
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
