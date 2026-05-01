import React from "react";
import { Box, Pressable, Tag } from "@ledgerhq/lumen-ui-rnative";
import { CheckmarkCircleFill, ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { HubStepRow } from "../HubStepRow";
import { type HubActionItemProps, useHubActionItemViewModel } from "./useHubActionItemViewModel";

export function HubActionItem(props: HubActionItemProps) {
  const { Icon } = props;
  const {
    titleText,
    descriptionText,
    tagText,
    isActionCompleted,
    isFeatureDisabled,
    isDisabled,
    handleRowPress,
  } = useHubActionItemViewModel(props);

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

  const tag = tagText ? <Tag appearance="accent" label={tagText} size="sm" /> : undefined;

  return (
    <Pressable
      lx={{ alignSelf: "stretch" }}
      onPress={isDisabled ? undefined : handleRowPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        selected: isActionCompleted,
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
