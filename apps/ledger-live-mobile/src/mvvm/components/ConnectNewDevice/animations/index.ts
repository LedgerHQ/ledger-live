import { resolveLottieSource, type LottieSource } from "LLM/components/Lottie";
import darkBluetooth from "./dark/bluetooth.lottie";
import darkBluetoothUsb from "./dark/bluetooth-usb.lottie";
import darkLoading from "./dark/loading.lottie";
import darkSuccess from "./dark/success.lottie";
import darkUsb from "./dark/usb.lottie";
import lightBluetooth from "./light/bluetooth.lottie";
import lightBluetoothUsb from "./light/bluetooth-usb.lottie";
import lightLoading from "./light/loading.lottie";
import lightSuccess from "./light/success.lottie";
import lightUsb from "./light/usb.lottie";

export type StateAnimation = "bluetooth" | "bluetoothAndUsb" | "usb" | "loading" | "success";

export type AnimationTheme = "light" | "dark";

/** Size of the spot in the canvas of every animation. */
const ANIMATION_SPOT_SIZE = 72;

type StateAnimationFiles = {
  light: LottieSource;
  dark: LottieSource;
  /** The canvas is larger than the spot when the spot grows or moves, so that it is not cut. */
  canvas: { width: number; height: number };
};

/** From the "spot" page of the Figma Symbols Library, exported by Design in both themes. */
export const stateAnimations: Record<StateAnimation, StateAnimationFiles> = {
  bluetooth: {
    light: resolveLottieSource(lightBluetooth),
    dark: resolveLottieSource(darkBluetooth),
    canvas: { width: 83, height: 83 },
  },
  bluetoothAndUsb: {
    light: resolveLottieSource(lightBluetoothUsb),
    dark: resolveLottieSource(darkBluetoothUsb),
    canvas: { width: 72, height: 72 },
  },
  usb: {
    light: resolveLottieSource(lightUsb),
    dark: resolveLottieSource(darkUsb),
    canvas: { width: 72, height: 78 },
  },
  loading: {
    light: resolveLottieSource(lightLoading),
    dark: resolveLottieSource(darkLoading),
    canvas: { width: 72, height: 72 },
  },
  success: {
    light: resolveLottieSource(lightSuccess),
    dark: resolveLottieSource(darkSuccess),
    canvas: { width: 76, height: 76 },
  },
};

/** Size to render an animation at, so that its spot is `spotSize` when it does not move. */
export function getAnimationSize(
  animation: StateAnimation,
  spotSize: number,
): { width: number; height: number } {
  const { canvas } = stateAnimations[animation];
  const scale = spotSize / ANIMATION_SPOT_SIZE;
  return { width: canvas.width * scale, height: canvas.height * scale };
}

/** Side of a square that holds every canvas. */
const BOX_SIZE = Math.max(
  ...Object.values(stateAnimations).flatMap(({ canvas }) => [canvas.width, canvas.height]),
);

/**
 * Side of the square box to render any animation in, so that the layout does not move between animations.
 * Every spot is at the centre of its canvas, or moves around it, so it stays in place when the canvas is centred.
 */
export function getAnimationBoxSize(spotSize: number): number {
  return BOX_SIZE * (spotSize / ANIMATION_SPOT_SIZE);
}
