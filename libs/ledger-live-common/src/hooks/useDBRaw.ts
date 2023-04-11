import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";

export type StateDB<State, Selected> = [
  Selected,
  Dispatch<SetStateAction<State>>
];

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

  useEffect(() => {
    getter().then((state) => {
      if (!state) {
        setterRaw(initialState);
        return;
      }

      setState(state);
    });
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setter = useCallback(
    (newState) => {
      const val = typeof newState === "function" ? newState(state) : newState;

      setState(val);
      setterRaw(val);
    },
    [state, setterRaw]
  );

  const result = useMemo(() => selector(state), [state, selector]);

  return [result, setter];
}
