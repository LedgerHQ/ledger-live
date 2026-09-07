export type PayCardTrackScreen = (page: string) => void;

export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type FeatureTourRowIcon = "Globe" | "Chart5" | "CreditCard";

export type FeatureTourRow = Readonly<{
  icon: FeatureTourRowIcon;
  title: string;
  description: string;
}>;

/**
 * Copy is resolved inside this package through `@shared/i18n`; the host only injects analytics.
 * Keys live under `payTab.featureTour.*` in each app's default namespace.
 */
export type FeatureTourProps = Readonly<{
  onTrackScreen?: PayCardTrackScreen;
  onTrackEvent?: PayCardTrackEvent;
}>;
