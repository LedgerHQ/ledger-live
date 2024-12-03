import React from "react";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import ParentCurrencyIcon from "~/components/ParentCurrencyIcon";
import BigNumber from "bignumber.js";
import CounterValue from "~/components/CounterValue";
import { Account, DerivationMode } from "@ledgerhq/types-live";
import { useMaybeAccountName } from "~/reducers/wallet";
import { getTagDerivationMode } from "@ledgerhq/coin-framework/lib/derivation";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";

interface AccountItemProps {
  account: Account;
  balance: BigNumber;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, balance }) => {
  const currency = account.currency;
  const accountName = useMaybeAccountName(account);
  const formattedAddress = formatAddress(account.freshAddress);
  const tag =
    account.type === "Account" &&
    account?.derivationMode !== undefined &&
    account?.derivationMode !== null &&
    currency.type === "CryptoCurrency" &&
    getTagDerivationMode(currency, account.derivationMode as DerivationMode);

  return (
    <>
      <Flex flex={1} flexShrink={1} testID={`accountItem-${accountName}`}>
        <Flex flexDirection="row" columnGap={8} alignItems="center" maxWidth="70%">
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
            <Flex flexShrink={0}>
              <Tag numberOfLines={1}>{tag}</Tag>
            </Flex>
          )}
        </Flex>
        <Flex flexDirection="row" columnGap={4} alignItems="center">
          <Text numberOfLines={1} variant="body" color="neutral.c70" flexShrink={1}>
            {formattedAddress}
          </Text>
          <ParentCurrencyIcon forceIconScale={1.5} currency={currency} size={20} />
        </Flex>
      </Flex>
      <Flex justifyContent="center" alignItems="flex-end">
        <Text variant="large" fontWeight="semiBold" color="neutral.c100" testID="asset-balance">
          <CounterValue currency={currency} value={balance} joinFragmentsSeparator="" />
        </Text>
      </Flex>
    </>
  );
};

export default AccountItem;
