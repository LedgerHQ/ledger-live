import React from "react";
import { Pressable } from "react-native";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Icon from "@ledgerhq/crypto-icons/native";
import type { DisabledItemExplanation } from "../../../types";

export type NetworkRowData = {
  id: string;
  name: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
};

type Props = NetworkRowData & {
  onClick: () => void;
  disabledExplanation?: DisabledItemExplanation;
  onDisabledPress?: (explanation: DisabledItemExplanation) => void;
};

const NEGATIVE_MARGIN_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };

export const NetworkRow = ({
  id,
  name,
  ticker,
  leftElement,
  rightElement,
  onClick,
  disabled,
  disabledExplanation,
  onDisabledPress,
}: Props) => {
  const listItem = (
    <ListItem
      disabled={disabled}
      onPress={disabled ? undefined : onClick}
      testID={`network-item-${name}`}
      lx={NEGATIVE_MARGIN_OFFSET}
    >
      <ListItemLeading>
        <Icon ledgerId={id} ticker={ticker} size={48} shape="square" />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{name}</ListItemTitle>
          {leftElement ? <ListItemContentRow>{leftElement}</ListItemContentRow> : null}
        </ListItemContent>
      </ListItemLeading>
      {rightElement ? <ListItemTrailing>{rightElement}</ListItemTrailing> : null}
    </ListItem>
  );

  if (!disabled || !disabledExplanation || !onDisabledPress) return listItem;

  return (
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={disabledExplanation.title}
      accessibilityHint={disabledExplanation.content}
      style={{ width: "100%" }}
      testID={`network-item-explanation-${name}`}
      onPress={() => onDisabledPress(disabledExplanation)}
    >
      <Box
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {listItem}
      </Box>
    </Pressable>
  );
};
