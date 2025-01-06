import React from "react";
import useAccountItemModel, { AccountItemProps } from "./useAccountItemModel";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import CounterValue from "~/components/CounterValue";
import ParentCurrencyIcon from "~/components/ParentCurrencyIcon";

type ViewProps = ReturnType<typeof useAccountItemModel>;

const View: React.FC<ViewProps> = ({ accountName, balance, formattedAddress, tag, currency }) => (
  <>
    <Flex flex={1} rowGap={2} flexShrink={1} testID={`accountItem-${accountName}`}>
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
        <ParentCurrencyIcon forceIconScale={2} currency={currency} size={20} />
      </Flex>
    </Flex>
    <Flex justifyContent="center" alignItems="flex-end">
      <Text variant="large" fontWeight="semiBold" color="neutral.c100" testID="asset-balance">
        <CounterValue currency={currency} value={balance} joinFragmentsSeparator="" />
      </Text>
    </Flex>
  </>
);

const AccountItem: React.FC<AccountItemProps> = props => {
  const model = useAccountItemModel(props);
  return <View {...model} />;
};

export default AccountItem;
