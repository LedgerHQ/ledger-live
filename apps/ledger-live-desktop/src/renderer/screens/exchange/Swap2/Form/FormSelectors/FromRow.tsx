import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import { fromSelector } from "~/renderer/actions/swap";
import InputCurrency from "~/renderer/components/InputCurrency";
import { ErrorContainer } from "~/renderer/components/Input";
import { SelectAccount } from "~/renderer/components/SelectAccount";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { amountInputContainerProps, renderAccountValue, selectRowStylesMap } from "./utils";
import { FormLabel } from "./FormLabel";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { track } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/sortByMarketcap";
import { listCryptoCurrencies, listTokens } from "@ledgerhq/live-common/currencies/index";

// Pick a default source account if none are selected.
// TODO use live-common once its ready
const usePickDefaultAccount = (accounts, fromAccount, setFromAccount): void => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);
  useEffect(() => {
    if (!fromAccount && allCurrencies.length > 0) {
      allCurrencies.some(({ id }) => {
        const filteredAcc = accounts.filter(
          acc => getAccountCurrency(acc)?.id === id && acc.balance.gt(0) && !acc.disabled,
        );
        if (filteredAcc.length > 0) {
          const defaultAccount = filteredAcc
            .sort((a, b) => b.balance.minus(a.balance).toNumber())
            .find(Boolean);
          setFromAccount(defaultAccount);
          return true;
        }
        return false;
      });
    }
  }, [accounts, allCurrencies, fromAccount, setFromAccount]);
};
type Props = {
  fromAccount: SwapSelectorStateType["account"];
  setFromAccount: SwapTransactionType["setFromAccount"];
  toggleMax: SwapTransactionType["toggleMax"];
  fromAmount: SwapSelectorStateType["amount"];
  setFromAmount: SwapTransactionType["setFromAmount"];
  isMaxEnabled: boolean;
  fromAmountError?: Error;
  provider: string | undefined | null;
  isSendMaxLoading: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
};
/* @dev: Yeah, Im sorry if you read this, design asked us to
 override the input component when it is called from the swap form. */
const InputSection = styled(Box)`
  & ${ErrorContainer} {
    font-weight: 500;
    font-size: 11px;
    text-align: right;
    margin-left: calc(calc(100% + 30px) * -1);
    margin-top: 6px;
    align-self: flex-end;
    margin-right: -15px;
  }
`;
function FromRow({
  fromAmount,
  setFromAmount,
  fromAccount,
  setFromAccount,
  isMaxEnabled,
  toggleMax,
  fromAmountError,
  provider,
  isSendMaxLoading,
  updateSelectedRate,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const accounts = useSelector(fromSelector)(useSelector(shallowAccountsSelector));
  const unit = fromAccount && getAccountUnit(fromAccount);
  const { t } = useTranslation();
  usePickDefaultAccount(accounts, fromAccount, setFromAccount);
  const trackEditAccount = () =>
    track("button_clicked", {
      button: "Edit source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
  const setAccountAndTrack = account => {
    updateSelectedRate();
    track("button_clicked", {
      button: "New source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      account: account,
    });
    setFromAccount(account);
  };
  const setValue = fromAmount => {
    track("button_clicked", {
      button: "Amount input",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      amount: null,
    });
    updateSelectedRate();
    setFromAmount(fromAmount);
  };
  const toggleMaxAndTrack = state => {
    track("button_clicked", {
      button: "max",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      state,
    });
    toggleMax(state);
  };
  return (
    <>
      <Box
        horizontal
        justifyContent="space-between"
        alignItems="flex-end"
        fontSize={3}
        mb={1}
        color={"palette.text.shade40"}
      >
        <FormLabel>{t("swap2.form.from.title")}</FormLabel>
        <Box horizontal alignItems="center">
          <Text ff="Inter|Medium" marginRight={1} fontSize={2}>
            {t("swap2.form.from.max")}
          </Text>
          <Switch
            small
            isChecked={isMaxEnabled}
            onChange={toggleMaxAndTrack}
            disabled={!fromAccount}
            data-test-id="swap-max-spendable-toggle"
          />
        </Box>
      </Box>
      <Box horizontal boxShadow="0px 2px 4px rgba(0, 0, 0, 0.05);">
        <Box width="50%">
          <SelectAccount
            accounts={accounts}
            value={fromAccount}
            onChange={setAccountAndTrack}
            stylesMap={selectRowStylesMap}
            placeholder={t("swap2.form.from.accountPlaceholder")}
            showAddAccount
            isSearchable={false}
            disabledTooltipText={t("swap2.form.from.currencyDisabledTooltip")}
            renderValue={renderAccountValue}
            onMenuOpen={trackEditAccount}
          />
        </Box>
        <InputSection width="50%">
          <InputCurrency
            loading={isSendMaxLoading}
            value={fromAmount}
            onChange={setValue}
            disabled={!fromAccount || isMaxEnabled}
            placeholder="0"
            textAlign="right"
            fontWeight={600}
            containerProps={amountInputContainerProps}
            unit={unit}
            // Flow complains if this prop is missing…
            renderRight={null}
            error={fromAmountError}
          />
        </InputSection>
      </Box>
    </>
  );
}
export default React.memo<Props>(FromRow);
