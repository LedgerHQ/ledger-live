import { useMemo, useState, useEffect, useCallback, Dispatch, SetStateAction } from "react";

export type StateDB<State, Selected> = [Selected, Dispatch<SetStateAction<State>>, boolean];

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
      .catch(e => {
        console.error("useDBRaw: failed to load initial state from storage", e);
        setterRaw(initialState);
      })
      .finally(() => {
        setIsLoaded(true);
      });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setter = useCallback(
    async newState => {
      const val = typeof newState === "function" ? newState(await getter()) : newState;

      setState(val);
      return setterRaw(val);
    },
    [getter, setterRaw],
  );

  const result = useMemo(() => selector(state), [state, selector]);
  return useMemo(() => [result, setter, isLoaded], [result, setter, isLoaded]);
}
