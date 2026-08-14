type OpenListener = () => void;

let openListener: OpenListener | null = null;

export const lazyOnboardingTourController = {
  registerOpen(listener: OpenListener): () => void {
    openListener = listener;
    return () => {
      if (openListener === listener) {
        openListener = null;
      }
    };
  },
  open(): void {
    openListener?.();
  },
};

export const __resetLazyOnboardingTourControllerForTests = () => {
  openListener = null;
};
