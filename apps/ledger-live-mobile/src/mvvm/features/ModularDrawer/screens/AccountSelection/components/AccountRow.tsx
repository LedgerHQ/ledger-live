import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemContentRow,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Icon from "@ledgerhq/crypto-icons/native";
import { RawDetailedAccount } from "../../../hooks/useDetailedAccounts";

type Props = {
  account: RawDetailedAccount;
  onClick: () => void;
};

const NEGATIVE_MARGIN_OFFSET: LumenViewStyle = { marginHorizontal: "-s8" };
const trailingStyle: LumenViewStyle = {
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "s4",
};

export const AccountRow = ({ account, onClick }: Props) => {
  const { name, address, balance, fiatValue, protocol, cryptoId, parentId, ticker } = account;
  const networkId = parentId ?? cryptoId;

  return (
    <ListItem onPress={onClick} testID="account-item" lx={NEGATIVE_MARGIN_OFFSET}>
      <ListItemLeading>
        <ListItemContent style={{ flex: 1, minWidth: 0 }}>
          <ListItemContentRow>
            <ListItemTitle numberOfLines={1} testID={`account-item-name-${name}`}>
              {name}
            </ListItemTitle>
            {protocol ? <Tag appearance="gray" size="sm" label={protocol.toUpperCase()} /> : null}
          </ListItemContentRow>
          <ListItemContentRow>
            <ListItemDescription numberOfLines={1}>{address}</ListItemDescription>
            {networkId && ticker ? (
              <Icon ledgerId={networkId} ticker={ticker} size={20} shape="square" />
            ) : null}
          </ListItemContentRow>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Box lx={trailingStyle}>
          {fiatValue ? (
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              {fiatValue}
            </Text>
          ) : null}
          {balance ? (
            <Text typography="body3" lx={{ color: "muted" }}>
              {balance}
            </Text>
          ) : null}
        </Box>
      </ListItemTrailing>
    </ListItem>
  );
};
