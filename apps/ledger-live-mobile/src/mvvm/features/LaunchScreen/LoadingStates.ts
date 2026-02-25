export enum LoadingState {
  SPLASH = "splash",
  LOTTIE_LOADING = "lottie",
  APP_READY = "app_ready",
}

export interface LoadingConfig {
  lottieMinDuration?: number;
  lottieMaxDuration?: number;
}

export const DEFAULT_LOADING_CONFIG: LoadingConfig = {
  lottieMinDuration: 0,
  lottieMaxDuration: 4500,
};
