/** Props with the same meaning on web and native; each platform adds its own `source` and `style`. */
export type LottieBaseProps = Readonly<{
  loop?: boolean;
  autoPlay?: boolean;
  /** Controls playback after mount; leave undefined to rely on `autoPlay` alone. */
  paused?: boolean;
  speed?: number;
  testID?: string;
  onComplete?: () => void;
}>;
