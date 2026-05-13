import { useTranslation } from "~/context/Locale";
import { usePostOnboardingActionPress } from "~/logic/postOnboarding/usePostOnboardingActionPress";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";

export type HubActionItemProps = Readonly<
  PostOnboardingActionRowProps & {
    closeHubDrawer?: () => void;
  }
>;

export function useHubActionItemViewModel(props: HubActionItemProps) {
  const { title, titleCompleted, description, tagLabel, disabled, productName, closeHubDrawer } =
    props;
  const { t } = useTranslation();
  const { isActionCompleted, handlePress, isPressDisabled } = usePostOnboardingActionPress(props);

  const handleRowPress = () => {
    closeHubDrawer?.();
    handlePress();
  };

  const titleText = t(isActionCompleted ? titleCompleted : title);
  let descriptionText: string | undefined;
  if (isActionCompleted) {
    descriptionText = t("postOnboarding.drawer.actionCompletedLabel");
  } else if (description) {
    descriptionText = t(description, { productName });
  }

  const isFeatureDisabled = !!disabled;
  const tagText = tagLabel ? t(tagLabel) : undefined;
  const isDisabled = isPressDisabled || isFeatureDisabled;

  return {
    titleText,
    descriptionText,
    tagText,
    isActionCompleted,
    isFeatureDisabled,
    isDisabled,
    handleRowPress,
  };
}
