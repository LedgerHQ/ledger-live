import type { GenericAwarenessModalFeatureIntro } from "@ledgerhq/live-common/genericAwarenessModal";

export type FeatureIntroViewModel = Readonly<{
  content: GenericAwarenessModalFeatureIntro;
  onPrimaryPress: () => void;
  onSecondaryPress: () => void;
}>;

export type FeatureIntroLayoutProps = Readonly<{
  onClose: () => void;
  viewModel: FeatureIntroViewModel;
}>;
