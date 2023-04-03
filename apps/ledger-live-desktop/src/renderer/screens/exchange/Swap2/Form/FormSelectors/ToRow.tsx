import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import SelectCurrency from "~/renderer/components/SelectCurrency";
import { amountInputContainerProps, renderCurrencyValue, selectRowStylesMap } from "./utils";
import { FormLabel } from "./FormLabel";
import { toSelector } from "~/renderer/actions/swap";
import { useSelector } from "react-redux";
import {
  usePickDefaultCurrency,
  useSelectableCurrencies,
} from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import {
  Container as InputContainer,
  BaseContainer as BaseInputContainer,
} from "~/renderer/components/Input";
import styled from "styled-components";
import CounterValue from "~/renderer/components/CounterValue";
import { track } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "../../utils/index";
type Props = {
  fromAccount: SwapSelectorStateType["account"];
  toAccount: SwapSelectorStateType["account"];
  toCurrency: SwapSelectorStateType["currency"];
  setToAccount: SwapTransactionType["setToAccount"];
  setToCurrency: SwapTransactionType["setToCurrency"];
  toAmount: SwapSelectorStateType["amount"];
  provider: string | undefined | null;
  loadingRates: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
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
  setToAccount,
  setToCurrency,
  toAmount,
  fromAccount,
  provider,
  toAccount,
  loadingRates,
  updateSelectedRate,
}: Props) {
  const fromCurrencyId = fromAccount ? getAccountCurrency(fromAccount).id : null;
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const allCurrencies = useSelector(toSelector)(fromCurrencyId);
  const currencies = useSelectableCurrencies({
    allCurrencies,
  });
  const unit = toCurrency?.units[0];
  usePickDefaultCurrency(currencies, toCurrency, setToCurrency);
  const trackEditCurrency = () =>
    track("button_clicked", {
      button: "Edit target currency",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
  const setCurrencyAndTrack = currency => {
    updateSelectedRate();
    track("button_clicked", {
      button: "New target currency",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      currency: currency.ticker || currency.name,
    });
    setToCurrency(currency);
  };
  return (
    <>
      <Box horizontal color={"palette.text.shade40"} fontSize={3} mb={1}>
        <FormLabel>
          <Trans i18nKey="swap2.form.to.title" />
        </FormLabel>
      </Box>
      <Box horizontal>
        <Box flex="1" data-test-id="destination-currency-dropdown">
          <SelectCurrency
            currencies={currencies}
            onChange={setCurrencyAndTrack}
            value={toCurrency}
            stylesMap={selectRowStylesMap}
            isDisabled={!fromAccount}
            renderValueOverride={renderCurrencyValue}
            onMenuOpen={trackEditCurrency}
          />
        </Box>
        <InputCurrencyContainer flex="1">
          <InputCurrency
            // @DEV: onChange props is required by the composant, there is no read-only logic
            onChange={() => null}
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
                  value={toAmount}
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
