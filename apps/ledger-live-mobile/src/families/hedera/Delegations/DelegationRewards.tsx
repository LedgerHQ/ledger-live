import React, { useCallback } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/lib/currencies/formatCurrencyUnit";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import CounterValue from "~/components/CounterValue";
import Button from "~/components/Button";
import AccountSectionLabel from "~/components/AccountSectionLabel";

interface Props {
  claimableRewards: BigNumber;
  currency: Currency;
  unit: Unit;
}

export default function DelegationRewards({ claimableRewards, currency, unit }: Props) {
  const { t } = useTranslation();

  const formattedClaimableRewards = formatCurrencyUnit(unit, claimableRewards, {
    showCode: true,
    disableRounding: true,
  });

  const onClaim = useCallback(() => {
    // FIXME: open claim rewards flow
  }, []);

  return (
    <Box mb={8}>
      <Box mb={6}>
        <AccountSectionLabel name={t("hedera.delegation.positions.rewards.title")} />
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
          title={t("hedera.delegation.positions.rewards.cta")}
          disabled={claimableRewards.lte(0)}
          onPress={onClaim}
        />
      </Flex>
    </Box>
  );
}
