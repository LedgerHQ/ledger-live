import React from "react";
import {
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

export type AssetRowData = {
  id: string;
  name: string;
  ticker: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
};

type Props = AssetRowData & {
  onClick: (asset: AssetRowData) => void;
};

const NEGATIVE_MARGIN_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };

export const AssetRow = ({ id, name, ticker, leftElement, rightElement, onClick }: Props) => (
  <ListItem
    onPress={() => onClick({ id, name, ticker })}
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
