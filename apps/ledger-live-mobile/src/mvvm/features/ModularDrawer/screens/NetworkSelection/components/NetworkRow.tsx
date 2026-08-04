import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Icon from "@ledgerhq/crypto-icons/native";

export type NetworkRowData = {
  id: string;
  name: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type Props = NetworkRowData & {
  onClick: () => void;
};

const NEGATIVE_MARGIN_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };

export const NetworkRow = ({ id, name, ticker, leftElement, rightElement, onClick }: Props) => (
  <ListItem onPress={onClick} testID={`network-item-${name}`} lx={NEGATIVE_MARGIN_OFFSET}>
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
