export type PayCardTrackScreen = (page: string) => void;

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type FeatureTourRowIcon = "Globe" | "Chart5" | "CreditCard";

export type FeatureTourRow = Readonly<{
  icon: FeatureTourRowIcon;
  title: string;
  description: string;
}>;

/**
 * User-facing copy injected by the host app. This package stays i18n-agnostic: the app
 * resolves translations (e.g. via `t("payCardFeatureTour.title")`) and passes the strings in.
 */
export type FeatureTourContent = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  rows: readonly FeatureTourRow[];
}>;

export type FeatureTourProps = FeatureTourContent &
  Readonly<{
    onTrackScreen?: PayCardTrackScreen;
    onTrackEvent?: PayCardTrackEvent;
  }>;
