type Listener = () => void;

export type ScrollCompactionStoreOptions = {
  /** Called when the store decides the compact state itself, e.g. to mirror it on the UI thread. */
  readonly onApply?: (isCompact: boolean) => void;
  readonly onReset?: (resetGeneration: number) => void;
};

export type ScrollCompactionStore = {
  readonly subscribe: (listener: Listener) => () => void;
  readonly getIsCompact: () => boolean;
  readonly getResetGeneration: () => number;
  readonly setCompact: (next: boolean) => void;
  /**
   * Records a state the mirror already applied, without writing it back: a late acknowledgement
   * must not overwrite a newer mirror decision. Dropped when computed before the last reset.
   */
  readonly acknowledgeCompact: (next: boolean, generation: number) => void;
  readonly reset: () => void;
};

export function createScrollCompactionStore({
  onApply,
  onReset,
}: ScrollCompactionStoreOptions = {}): ScrollCompactionStore {
  const listeners = new Set<Listener>();
  let isCompact = false;
  let resetGeneration = 0;

  function commit(next: boolean) {
    if (next === isCompact) return;
    isCompact = next;
    listeners.forEach(listener => listener());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getIsCompact: () => isCompact,
    getResetGeneration: () => resetGeneration,
    setCompact(next) {
      if (next !== isCompact) onApply?.(next);
      commit(next);
    },
    acknowledgeCompact(next, generation) {
      if (generation !== resetGeneration) return;
      commit(next);
    },
    reset() {
      resetGeneration += 1;
      onReset?.(resetGeneration);
      onApply?.(false);
      commit(false);
    },
  };
}
