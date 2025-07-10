import React, { useCallback } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import type { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import CounterValue from "~/components/CounterValue";
import Button from "~/components/Button";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import { NavigatorName, ScreenName } from "~/const";

interface Props {
  account: HederaAccount;
  claimableRewards: BigNumber;
  currency: Currency;
  unit: Unit;
}

export default function DelegationRewards({ account, claimableRewards, currency, unit }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const formattedClaimableRewards = formatCurrencyUnit(unit, claimableRewards, {
    showCode: true,
    disableRounding: true,
  });

  const onClaim = useCallback(() => {
    navigation.navigate(NavigatorName.HederaClaimRewardsFlow, {
      screen: ScreenName.HederaClaimRewardsSelectReward,
      params: {
        accountId: account.id,
      },
    });
  }, [account.id, navigation]);

  return (
    <Box mb={8}>
      <Box mb={6}>
        <AccountSectionLabel name={t("hedera.delegatedPositions.rewards.title")} />
      </Box>
      <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
        <Flex rowGap={2}>
          <Text fontSize={16} fontWeight="semiBold">
            {formattedClaimableRewards}
          </Text>
          <Text color="grey">
            <CounterValue
              currency={currency}
              showCode={true}
              value={claimableRewards}
              alwaysShowSign={false}
              withPlaceholder
            />
          </Text>
        </Flex>
        <Button
          type="primary"
          title={t("hedera.delegatedPositions.rewards.cta")}
          disabled={claimableRewards.lte(0)}
          onPress={onClaim}
        />
      </Flex>
    </Box>
  );
}
