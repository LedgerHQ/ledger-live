export interface AnalyticsIntroductionSectionProps {
  /** The card was closed or its CTA used: it no longer shows on Account Detail. */
  readonly hasDismissed: boolean;
  readonly onReset: () => void;
}

/** One key per section, so a new Account Detail control adds a key without touching the others. */
export interface AccountDetailToolProps {
  readonly analyticsIntroduction: AnalyticsIntroductionSectionProps;
}
