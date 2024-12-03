import React from "react";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import ParentCurrencyIcon from "~/components/ParentCurrencyIcon";
import BigNumber from "bignumber.js";
import CounterValue from "~/components/CounterValue";
import { Account } from "@ledgerhq/types-live";
import { useMaybeAccountName } from "~/reducers/wallet";

interface AccountRowProps {
  account: Account;
  balance: BigNumber;
}

const formatAddress = (address: string) => {
  if (address.length > 11) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return address;
};

const AccountRow: React.FC<AccountRowProps> = ({ account, balance }) => {
  const currency = account.currency;
  const accountName = useMaybeAccountName(account);
  const formattedAddress = formatAddress(account.freshAddress);
  const tag = account.derivationMode;

  return (
    <Flex height={40} flexDirection="row" columnGap={12} justifyContent="space-between">
      <Flex flex={1} flexShrink={1} maxWidth={"70%"}>
        <Flex flexDirection="row" columnGap={4} alignItems="center">
          <Text
            numberOfLines={1}
            variant="large"
            fontWeight="semiBold"
            color="neutral.c100"
            flexShrink={1}
          >
            {accountName}
          </Text>
          {tag && (
            <Flex mx={3} flexShrink={0}>
              <Tag numberOfLines={1}>{tag}</Tag>
            </Flex>
          )}
        </Flex>
        <Flex flexDirection="row" columnGap={4} alignItems="center">
          <Text numberOfLines={1} variant="body" color="neutral.c70" flexShrink={1}>
            {formattedAddress}
          </Text>
          <ParentCurrencyIcon currency={currency} size={20} />
        </Flex>
      </Flex>
      <Flex justifyContent="center">
        <Text variant="large" fontWeight="semiBold" color="neutral.c100" testID="asset-balance">
          <CounterValue currency={currency} value={balance} joinFragmentsSeparator="" />
        </Text>
      </Flex>
    </Flex>
  );
};

export default AccountRow;
