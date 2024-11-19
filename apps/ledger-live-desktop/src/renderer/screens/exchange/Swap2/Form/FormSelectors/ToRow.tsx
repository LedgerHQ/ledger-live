import {
  useFetchCurrencyTo,
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import {
  SwapDataType,
  SwapSelectorStateType,
  SwapTransactionType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import Box from "~/renderer/components/Box/Box";
import CounterValue from "~/renderer/components/CounterValue";
import {
  BaseContainer as BaseInputContainer,
  Container as InputContainer,
} from "~/renderer/components/Input";
import InputCurrency from "~/renderer/components/InputCurrency";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { FormLabel } from "./FormLabel";
import { amountInputContainerProps, renderCurrencyValue, selectRowStylesMap } from "./utils";

type Props = {
  fromAccount: SwapSelectorStateType["account"];
  toAccount: SwapSelectorStateType["account"];
  toCurrency: SwapSelectorStateType["currency"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  toAmount: SwapSelectorStateType["amount"];
  provider: string | undefined | null;
  loadingRates: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
  counterValue?: BigNumber;
};

const InputCurrencyContainer = styled(Box)`
  ${InputContainer} {
    display: flex;
    background: none;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }

  ${BaseInputContainer} {
    flex: 0;
  }
`;

function ToRow({
  toCurrency,
  setToCurrency,
  toAmount,
  fromAccount,
  loadingRates,
  updateSelectedRate,
  counterValue,
}: Props) {
  const { data: currenciesTo, isLoading: currenciesToIsLoading } = useFetchCurrencyTo({
    fromCurrencyAccount: fromAccount,
  });
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const currencies = useSelectableCurrencies({
    allCurrencies: currenciesTo ?? [],
  });
  const unit = toCurrency?.units[0];
  usePickDefaultCurrency(currencies, toCurrency, setToCurrency);
  const trackEditCurrency = () =>
    track("button_clicked2", {
      button: "Edit target currency",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
  const setCurrencyAndTrack = (currency: CryptoOrTokenCurrency | null | undefined) => {
    updateSelectedRate();
    track("button_clicked2", {
      button: "New target currency",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      currency: currency?.ticker || currency?.name,
    });
    setToCurrency(currency || undefined);
  };

  return (
    <>
      <Box horizontal color={"palette.text.shade40"} fontSize={3} mb={1}>
        <FormLabel>
          <Trans i18nKey="swap2.form.to.title" />
        </FormLabel>
      </Box>
      <Box horizontal>
        <Box flex="1" data-testid="destination-currency-dropdown">
          <SelectCurrency
            currencies={currencies}
            onChange={setCurrencyAndTrack}
            value={toCurrency}
            stylesMap={selectRowStylesMap}
            isDisabled={!fromAccount || currenciesToIsLoading}
            renderValueOverride={renderCurrencyValue}
            onMenuOpen={trackEditCurrency}
          />
        </Box>
        <InputCurrencyContainer flex="1">
          <InputCurrency
            // @DEV: onChange props is required by the component, there is no read-only logic
            onChange={() => null}
            data-testid="destination-currency-amount"
            value={unit ? toAmount : null}
            disabled
            placeholder="-"
            textAlign="right"
            fontWeight={600}
            color="palette.text.shade40"
            containerProps={amountInputContainerProps}
            unit={unit}
            loading={loadingRates}
            renderRight={
              toCurrency &&
              unit &&
              toAmount &&
              !loadingRates && (
                <CounterValue
                  currency={toCurrency}
                  counterValue={counterValue}
                  value={toAmount}
                  data-testid="destination-currency-amount-value"
                  color="palette.text.shade40"
                  ff="Inter|Medium"
                  fontSize={3}
                  placeholderStyle={{
                    padding: "0 15px",
                  }}
                  pr={3}
                  mt="4px"
                  style={{
                    lineHeight: "1em",
                  }}
                />
              )
            }
          />
        </InputCurrencyContainer>
      </Box>
    </>
  );
}
export default React.memo<Props>(ToRow);
