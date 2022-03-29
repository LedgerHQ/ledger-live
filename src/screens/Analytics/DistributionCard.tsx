// @flow
import React, { useMemo } from "react";
import {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/live-common/lib/types/currencies";
import { getCurrencyColor } from "@ledgerhq/live-common/lib/currencies";

import styled, { useTheme } from "styled-components/native";
import { Text, Flex } from "@ledgerhq/native-ui";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import ProgressBar from "../../components/ProgressBar";
import CounterValue from "../../components/CounterValue";
import ParentCurrencyIcon from "../../components/ParentCurrencyIcon";
import { ensureContrast } from "../../colors";

export type DistributionItem = {
  currency: CryptoCurrency | TokenCurrency;
  distribution: number; // % of the total (normalized in 0-1)
  amount: number;
  countervalue: number; // countervalue of the amount that was calculated based of the rate provided
};

type Props = {
  item: DistributionItem;
};

const Container = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 32,
  width: "100%",
})``;

const IconContainer = styled(Flex).attrs({
  marginRight: 6,
  alignItems: "center",
  justifyContent: "center",
})``;

const CoinInfoContainer = styled(Flex).attrs({
  flexGrow: 1,
  flexShrink: 1,
  flexDirection: "column",
})``;

const CurrencyRow = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  flexWrap: "wrap",
})``;

const RateRow = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  flexWrap: "wrap",
})``;

const DistributionRow = styled(Flex).attrs({
  marginTop: 4,
  flexDirection: "row",
  alignItems: "center",
})``;

export default function DistributionCard({
  item: { currency, amount, distribution },
}: Props) {
  const { colors } = useTheme();
  const color = useMemo(
    () => ensureContrast(getCurrencyColor(currency), colors.background.main),
    [colors, currency],
  );
  const percentage = Math.round(distribution * 1e4) / 1e2;

  return (
    <Container>
      <Flex flexDirection="row">
        <IconContainer>
          {/** @ts-expect-error flow issue */}
          <ParentCurrencyIcon currency={currency} size={32} />
        </IconContainer>
        <CoinInfoContainer>
          <CurrencyRow>
            <Text variant="large" color="neutral.c100" fontWeight="semiBold">
              {currency.name}
            </Text>
            <Text variant="large" color="neutral.c100" fontWeight="semiBold">
              {`${percentage}%`}
            </Text>
          </CurrencyRow>
          {distribution ? (
            <>
              <RateRow>
                <Text variant="body" color="neutral.c70" fontWeight="medium">
                  <CurrencyUnitValue unit={currency.units[0]} value={amount} />
                </Text>
                <Text variant="body" color="neutral.c70" fontWeight="medium">
                  <CounterValue currency={currency} value={amount} />
                </Text>
              </RateRow>
            </>
          ) : null}
        </CoinInfoContainer>
      </Flex>
      {distribution ? (
        <DistributionRow>
          {/** @ts-expect-error flow issue */}
          <ProgressBar
            progress={percentage}
            progressColor={color}
            backgroundColor={colors.neutral.c40}
          />
        </DistributionRow>
      ) : null}
    </Container>
  );
}
