export enum FlowStep {
  SELECT_ASSET_TYPE = "SELECT_ASSET_TYPE",
  SELECT_NETWORK = "SELECT_NETWORK",
  SELECT_ACCOUNT = "SELECT_ACCOUNT",
}

export enum NavigationDirection {
  FORWARD = "FORWARD",
  BACKWARD = "BACKWARD",
}

const ANIMATION_COMMON = { transition: { duration: 0.3 } };

export const ANIMATION_VARIANTS = {
  initial: (direction: NavigationDirection) => ({
    y: direction === NavigationDirection.FORWARD ? 20 : -20,
    opacity: 0,
    ...ANIMATION_COMMON,
  }),
  animate: { y: 0, opacity: 1, ...ANIMATION_COMMON },
  exit: (direction: NavigationDirection) => ({
    y: direction === NavigationDirection.FORWARD ? -20 : 20,
    opacity: 0,
    ...ANIMATION_COMMON,
  }),
};
