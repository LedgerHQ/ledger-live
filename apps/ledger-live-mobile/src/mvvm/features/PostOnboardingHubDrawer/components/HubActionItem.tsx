import React, { useCallback } from "react";
import { Box, Pressable, Tag } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { usePostOnboardingActionPress } from "~/logic/postOnboarding/usePostOnboardingActionPress";
import type { PostOnboardingActionRowProps } from "~/components/PostOnboarding/PostOnboardingActionRow.types";
import { HubStepRow } from "./HubStepRow";

type HubActionItemProps = Readonly<
  PostOnboardingActionRowProps & {
    onActionPress?: () => void;
  }
>;

export function HubActionItem(props: HubActionItemProps) {
  const {
    Icon,
    title,
    titleCompleted,
    description,
    tagLabel,
    disabled,
    productName,
    onActionPress,
  } = props;
  const { t } = useTranslation();
  const { isActionCompleted, handlePress, isPressDisabled } = usePostOnboardingActionPress(props);

  const onPress = useCallback(() => {
    handlePress();
    onActionPress?.();
  }, [handlePress, onActionPress]);

  const titleText = t(isActionCompleted ? titleCompleted : title);
  const descriptionText = isActionCompleted
    ? t("postOnboarding.hub.deviceStepComplete")
    : description
      ? t(description, { productName })
      : undefined;

  const isFeatureDisabled = !!disabled;

  const leadingIcon = isActionCompleted ? (
    <CheckmarkCircleFill size={24} color="success" />
  ) : (
    <Box lx={{ width: "s24", height: "s24", alignItems: "center", justifyContent: "center" }}>
      <Icon size="M" color="neutral.c100" />
    </Box>
  );

  const trailing =
    !isFeatureDisabled && !isActionCompleted ? (
      <Box lx={{ marginLeft: "s8", alignSelf: "center" }}>
        <ChevronRight size={24} color="muted" />
      </Box>
    ) : undefined;

  const tag = tagLabel ? <Tag appearance="accent" label={t(tagLabel)} size="sm" /> : undefined;

  return (
    <Pressable
      lx={{ alignSelf: "stretch" }}
      onPress={isPressDisabled ? undefined : onPress}
      disabled={isFeatureDisabled}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isPressDisabled || isFeatureDisabled,
        checked: isActionCompleted,
      }}
    >
      <HubStepRow
        leadingIcon={leadingIcon}
        title={titleText}
        description={descriptionText}
        tag={tag}
        trailing={trailing}
        opacity={isFeatureDisabled ? 0.5 : 1}
      />
    </Pressable>
  );
}
