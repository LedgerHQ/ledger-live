import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  Dispatch,
  SetStateAction,
} from "react";

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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
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

type DBRecordSnapshot<State> = { state: State; isLoaded: boolean };

export type DBRecord<State> = {
  getSnapshot: () => DBRecordSnapshot<State>;
  subscribe: (listener: () => void) => () => void;
  setState: Dispatch<SetStateAction<State>>;
};

/**
 * One in-memory copy of a persisted record, shared by every hook that reads it.
 * Each update applies to the latest state, so hooks that change different fields
 * do not erase each other. Create it once per record, at module level.
 * A failed read blocks writes: updates stay queued and the next subscribe or update
 * retries the read.
 */
export function createDBRecord<State>({
  initialState,
  getter,
  setter,
}: {
  initialState: State;
  getter: () => Promise<State | undefined>;
  setter: (val: State) => Promise<void> | void;
}): DBRecord<State> {
  let snapshot: DBRecordSnapshot<State> = { state: initialState, isLoaded: false };
  let isReading = false;
  // Updates made before a read succeeds, replayed on the stored state
  let pendingUpdates: SetStateAction<State>[] = [];
  const listeners = new Set<() => void>();

  const apply = (state: State, action: SetStateAction<State>) =>
    isUpdater(action) ? action(state) : action;

  const write = (state: State) => {
    void setter(state);
  };

  const emit = (next: DBRecordSnapshot<State>) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };

  const read = () => {
    if (snapshot.isLoaded || isReading) return;
    isReading = true;
    getter().then(
      stored => {
        isReading = false;
        const updates = pendingUpdates;
        pendingUpdates = [];
        const state = updates.reduce<State>(
          (current, action) => apply(current, action),
          stored ?? initialState,
        );
        if (updates.length > 0) write(state);
        emit({ state, isLoaded: true });
      },
      () => {
        isReading = false;
      },
    );
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: listener => {
      listeners.add(listener);
      read();
      return () => {
        listeners.delete(listener);
      };
    },
    setState: action => {
      const state = apply(snapshot.state, action);
      if (snapshot.isLoaded) {
        write(state);
      } else {
        pendingUpdates.push(action);
        read();
      }
      emit({ ...snapshot, state });
    },
  };
}

export function useDBRecord<State, Selected>(
  record: DBRecord<State>,
  selector: (state: State) => Selected,
): StateDB<State, Selected> {
  const { state, isLoaded } = useSyncExternalStore(record.subscribe, record.getSnapshot);
  const result = useMemo(() => selector(state), [state, selector]);
  return useMemo(() => [result, record.setState, isLoaded], [result, record, isLoaded]);
}
