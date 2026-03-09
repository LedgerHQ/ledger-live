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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getter().then(state => {
      if (!state) {
        setterRaw(initialState);
      } else {
        setState(state);
      }
      setLoaded(true);
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
  return [result, setter, loaded];
}
