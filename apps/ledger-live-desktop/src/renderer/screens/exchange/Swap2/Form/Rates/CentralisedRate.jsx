// @flow
import React from "react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import type {
  ExchangeRate,
  SwapSelectorStateType,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  getProviderName,
  isRegistrationRequired,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import Price from "~/renderer/components/Price";
import CounterValue from "~/renderer/components/CounterValue";
import { Trans } from "react-i18next";
import Rate from "./Rate";

export type Props = {
  value?: ExchangeRate,
  onSelect: ExchangeRate => void,
  selected?: boolean,
  fromCurrency?: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency?: $PropertyType<SwapSelectorStateType, "currency">,
};

function CentralisedRate({ value = {}, selected, onSelect, fromCurrency, toCurrency }: Props) {
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
          <Box style={{ height: "19.5px", justifyContent: "center" }}>
            <Price
              withEquality
              withIcon={false}
              from={fromCurrency}
              to={toCurrency}
              rate={value.magnitudeAwareRate}
              fontWeight="600"
            />
          </Box>
          <Text fontSize={3} color="palette.text.shade40">
            <Trans
              i18nKey={
                value.tradeMethod === "fixed" ? "swap2.form.rates.fixed" : "swap2.form.rates.float"
              }
            />
          </Text>
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
          />
          <CounterValue
            fontSize={3}
            inline
            currency={toCurrency}
            value={amount}
            disableRounding
            showCode
            color="palette.text.shade40"
          />
        </>
      }
    ></Rate>
  );
}

export default React.memo<Props>(CentralisedRate);
