import React from "react";
import styled from "styled-components";
import { Text } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { ExchangeRate, SwapSelectorStateType } from "@ledgerhq/live-common/exchange/swap/types";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import {
  getProviderName,
  isRegistrationRequired,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import Price from "~/renderer/components/Price";
import CounterValue from "~/renderer/components/CounterValue";
import { Trans } from "react-i18next";
import Rate from "./Rate";
export type Props = {
  value?: ExchangeRate;
  onSelect: (a: ExchangeRate) => void;
  selected?: boolean;
  fromCurrency?: SwapSelectorStateType["currency"];
  toCurrency?: SwapSelectorStateType["currency"];
};
const SecondaryText: ThemedComponent<{}> = styled(Text)`
  color: ${p => p.theme.colors.neutral.c70};
`;
const StyledCounterValue: ThemedComponent<{}> = styled(CounterValue)`
  color: ${p => p.theme.colors.neutral.c70};
`;
function SwapRate({ value = {}, selected, onSelect, fromCurrency, toCurrency }: Props) {
  const { toAmount: amount, provider } = value;
  return (
    <Rate
      value={value}
      selected={selected}
      onSelect={onSelect}
      icon={provider.toLowerCase()}
      title={getProviderName(value.provider)}
      subtitle={
        <Trans
          i18nKey={
            isRegistrationRequired(value.provider)
              ? "swap2.form.rates.registration"
              : "swap2.form.rates.noRegistration"
          }
        />
      }
      centerContainer={
        <Box>
          <Box
            style={{
              height: "19.5px",
              justifyContent: "center",
            }}
          >
            <Price
              withEquality
              withIcon={false}
              from={fromCurrency}
              to={toCurrency}
              rate={value.magnitudeAwareRate}
              fontWeight="600"
              color="palette.text.shade100"
              staticSignificantDigits={7}
            />
          </Box>
          <SecondaryText fontSize={3}>
            <Trans
              i18nKey={
                value.tradeMethod === "fixed" ? "swap2.form.rates.fixed" : "swap2.form.rates.float"
              }
            />
          </SecondaryText>
        </Box>
      }
      rightContainer={
        <>
          <FormattedVal
            inline
            fontSize={4}
            val={amount}
            currency={toCurrency}
            unit={toCurrency?.units[0]}
            showCode={true}
            color="palette.text.shade100"
            fontWeight="600"
            staticSignificantDigits={7}
          />
          <StyledCounterValue
            fontSize={3}
            inline
            currency={toCurrency}
            value={amount}
            disableRounding
            showCode
          />
        </>
      }
    ></Rate>
  );
}
export default React.memo<Props>(SwapRate);
