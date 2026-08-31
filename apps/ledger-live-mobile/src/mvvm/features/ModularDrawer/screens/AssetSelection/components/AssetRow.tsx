import React from "react";
import { Pressable } from "react-native";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Icon from "@ledgerhq/crypto-icons/native";
import type { DisabledItemExplanation } from "../../../types";

export type AssetRowData = {
  id: string;
  name: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
};

type Props = AssetRowData & {
  onClick: (asset: AssetRowData) => void;
  disabledExplanation?: DisabledItemExplanation;
  onDisabledPress?: (explanation: DisabledItemExplanation) => void;
};

const NEGATIVE_MARGIN_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };

export const AssetRow = ({
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
      onPress={disabled ? undefined : () => onClick({ id, name, ticker, disabled })}
      testID={`asset-item-${ticker}`}
      lx={NEGATIVE_MARGIN_OFFSET}
    >
      <ListItemLeading>
        <Icon ledgerId={id} ticker={ticker} size={48} />
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemTitle numberOfLines={1}>{name}</ListItemTitle>
          <ListItemContentRow>
            <ListItemDescription numberOfLines={1}>{ticker}</ListItemDescription>
            {leftElement}
          </ListItemContentRow>
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
      testID={`asset-item-explanation-${ticker}`}
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
