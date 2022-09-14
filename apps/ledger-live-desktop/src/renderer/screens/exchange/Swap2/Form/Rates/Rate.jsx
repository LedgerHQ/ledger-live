// @flow
import React, { useCallback } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import {
  getProviderName,
  isRegistrationRequired,
} from "@ledgerhq/live-common/exchange/swap/utils/index";
import { rgba } from "~/renderer/styles/helpers";
import type { SwapSelectorStateType } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import Price from "~/renderer/components/Price";
import CounterValue from "~/renderer/components/CounterValue";
import { iconByProviderName } from "../../utils";
import { Trans } from "react-i18next";

const ProviderContainer: ThemedComponent<{}> = styled(Box).attrs({
  horizontal: true,
  alignItems: "center",
  ff: "Inter|SemiBold",
})`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  cursor: pointer;
  ${p =>
    p.selected
      ? `
    border-color: ${p.theme.colors.palette.primary.main};
    box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.palette.primary.main, 0.8)};
    background-color: ${rgba(p.theme.colors.palette.primary.main, 0.2)};
    `
      : `
    :hover {
      box-shadow: 0px 0px 2px 1px ${p.theme.colors.palette.divider};
    }`}
`;

export type Props = {
  value: ExchangeRate,
  onSelect: ExchangeRate => void,
  selected?: boolean,
  fromCurrency: $PropertyType<SwapSelectorStateType, "currency">,
  toCurrency: $PropertyType<SwapSelectorStateType, "currency">,
};

function Rate({ value, selected, onSelect, fromCurrency, toCurrency }: Props) {
  const handleSelection = useCallback(() => onSelect(value), [value, onSelect]);

  const { toAmount: amount, provider } = value;
  const ProviderIcon = provider && iconByProviderName[provider.toLowerCase()];

  return (
    <ProviderContainer p={3} mb={3} fontWeight="400" selected={selected} onClick={handleSelection}>
      {ProviderIcon && (
        <Box mr={2}>
          <ProviderIcon size={28} />
        </Box>
      )}
      <Box flex={1}>
        <Box horizontal color="palette.text.shade100" fontSize={4}>
          <Box flex={1}>
            <Text fontWeight="600">{getProviderName(value.provider)}</Text>
            <Box>
              <Text fontSize={3} color="palette.text.shade40">
                <Trans
                  i18nKey={
                    isRegistrationRequired(value.provider)
                      ? "swap2.form.rates.registration"
                      : "swap2.form.rates.noRegistration"
                  }
                />
              </Text>
            </Box>
          </Box>
          <Box alignItems="center" flex={1}>
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
                    value.tradeMethod === "fixed"
                      ? "swap2.form.rates.fixed"
                      : "swap2.form.rates.float"
                  }
                />
              </Text>
            </Box>
          </Box>
          <Box alignItems="flex-end" flex={1}>
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
          </Box>
        </Box>
      </Box>
    </ProviderContainer>
  );
}

export default React.memo<Props>(Rate);
