import { useMemo, useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";

export type StateDB<State, Selected> = [Selected, Dispatch<SetStateAction<State>>, boolean];

function isUpdater<S>(action: SetStateAction<S>): action is (prev: S) => S {
  return typeof action === "function";
}

export function useDBRaw<State, Selected>({
  initialState,
  getter,
  setter: setterRaw,
  selector,
}: {
  initialState: State;
  getter: () => Promise<State | undefined>;
  setter: (val: State) => Promise<void> | void;
  selector: (state: State) => Selected;
}): StateDB<State, Selected> {
  const [state, setState] = useState<State>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getter()
      .then(getterState => {
        if (!getterState) {
          setterRaw(initialState);
        } else {
          setState(getterState);
        }
      })
      .finally(() => {
        setIsLoaded(true);
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setter: Dispatch<SetStateAction<State>> = useCallback(
    (newState: SetStateAction<State>) => {
      setState(prev => {
        const val = isUpdater(newState) ? newState(prev) : newState;
        setterRaw(val);
        return val;
      });
    },
    [setterRaw],
  );

  const result = useMemo(() => selector(state), [state, selector]);
  return useMemo(() => [result, setter, isLoaded], [result, setter, isLoaded]);
}
