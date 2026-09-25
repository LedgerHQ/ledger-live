type Params = {
  readonly skip: boolean;
};

/** Desktop has no phone wallet to wait on, and no app foreground event to re-read on. */
export function useCardStatusRefresh(_params: Params): void {}
