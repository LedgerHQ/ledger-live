export interface AccountAnalyticsIntroductionToolProps {
  /** The card was closed or its CTA used: it no longer shows on Account Detail. */
  readonly hasDismissed: boolean;
  readonly onReset: () => void;
}
