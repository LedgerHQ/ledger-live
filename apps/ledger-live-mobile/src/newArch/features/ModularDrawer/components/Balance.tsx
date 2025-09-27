import React from "react";
import styled from "styled-components/native";
import { Text } from "@ledgerhq/native-ui";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useSelector } from "react-redux";
import { counterValueCurrencySelector } from "~/reducers/settings";

const BalanceContainer = styled.View`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

// Local component for fiat value display without styling
const FiatValue = ({
  currency,
  balance,
}: {
  currency: CryptoOrTokenCurrency;
  balance: BigNumber;
}) => {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterValue = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: balance.toNumber(),
  });

  if (!counterValue || !counterValueCurrency) {
    return <>-</>;
  }

  return <CurrencyUnitValue unit={counterValueCurrency.units[0]} value={counterValue} showCode />;
};

export const balanceItem = ({
  currency,
  balance,
}: {
  currency?: CryptoOrTokenCurrency;
  balance?: BigNumber;
}) => {
  return (
    <BalanceContainer>
      <Text fontSize="14px" variant="largeLineHeight" fontWeight="semiBold" color="neutral.c100">
        {currency && balance ? <FiatValue currency={currency} balance={balance} /> : "-"}
      </Text>
      <Text
        fontSize="12px"
        lineHeight="16px"
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c80"
      >
        {currency && balance ? (
          <CurrencyUnitValue unit={currency.units[0]} value={balance} showCode />
        ) : (
          "-"
        )}
      </Text>
    </BalanceContainer>
  );
};
