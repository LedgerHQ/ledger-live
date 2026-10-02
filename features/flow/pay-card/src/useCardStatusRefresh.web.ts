type Params = {
  readonly skip: boolean;
};

export function useCardStatusRefresh(_params: Params): void {
  // Desktop has no phone wallet to wait on, and no app foreground event to re-read on.
}
