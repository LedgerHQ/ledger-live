type Listener = () => void;

export type ScrollCompactionStoreOptions = {
  /** Called with the compact state each time it is applied or restored, e.g. to mirror it on the UI thread. */
  readonly onApply?: (isCompact: boolean) => void;
  readonly onReset?: (resetGeneration: number) => void;
};

export type ScrollCompactionStore = {
  readonly subscribe: (listener: Listener) => () => void;
  readonly getIsCompact: () => boolean;
  readonly getResetGeneration: () => number;
  /**
   * `generation` is the reset generation the update was computed under: an update queued before a
   * reset is dropped, so it cannot compact again without a new scroll.
   */
  readonly setCompact: (next: boolean, generation?: number) => void;
  readonly reset: () => void;
};

export function createScrollCompactionStore({
  onApply,
  onReset,
}: ScrollCompactionStoreOptions = {}): ScrollCompactionStore {
  const listeners = new Set<Listener>();
  let isCompact = false;
  let resetGeneration = 0;

  function setCompact(next: boolean, generation = resetGeneration) {
    if (generation !== resetGeneration) {
      onApply?.(isCompact);
      return;
    }
    onApply?.(next);
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
    setCompact,
    reset() {
      resetGeneration += 1;
      onReset?.(resetGeneration);
      setCompact(false);
    },
  };
}
