import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import Box from "~/renderer/components/Box";
import InputCurrency from "~/renderer/components/InputCurrency";
import { ErrorContainer } from "~/renderer/components/Input";
import { SelectAccount } from "~/renderer/components/SelectAccount";
import Switch from "~/renderer/components/Switch";
import Text from "~/renderer/components/Text";
import { amountInputContainerProps, renderAccountValue, selectRowStylesMap } from "./utils";
import { FormLabel } from "./FormLabel";
import {
  SwapSelectorStateType,
  SwapTransactionType,
  SwapDataType,
} from "@ledgerhq/live-common/exchange/swap/types";
import { track } from "~/renderer/analytics/segment";
import { useGetSwapTrackingProperties } from "../../utils/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { listCryptoCurrencies, listTokens } from "@ledgerhq/live-common/currencies/index";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TranslatedError } from "~/renderer/components/TranslatedError/TranslatedError";
import { WarningSolidMedium } from "@ledgerhq/react-ui/assets/icons";
import { useSwapableAccounts } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useSelector } from "react-redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

const SwapStatusContainer = styled.div<{ isError: boolean }>(
  ({ theme: { space, colors }, isError }) => `
  margin-top: ${space[1]}px;
  display: grid;
  grid-template-columns: 16px auto;
  align-items: center;
  column-gap: ${space[1]}px;
  color: ${isError ? colors.error.c70 : colors.warning};
`,
);

const SwapStatusText = styled(Text)(
  () => `
  & button, a {
    text-decoration: underline;
    cursor: pointer;
  }
`,
);

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

// Pick a default source account if none are selected.
// TODO use live-common once its ready
const usePickDefaultAccount = (
  accounts: AccountLike[],
  fromAccount: AccountLike | undefined,
  setFromAccount: (acc?: AccountLike) => void,
): void => {
  const list = [...listCryptoCurrencies(), ...listTokens()];
  const allCurrencies = useCurrenciesByMarketcap(list);
  useEffect(() => {
    if (!fromAccount && allCurrencies.length > 0) {
      allCurrencies.some(({ id }) => {
        const filteredAcc = accounts.filter(
          acc =>
            getAccountCurrency(acc)?.id === id &&
            acc.balance.gt(0) &&
            (!("disabled" in acc) || !acc.disabled),
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
  fromAmountWarning?: Error;
  provider: string | undefined | null;
  isSendMaxLoading: boolean;
  updateSelectedRate: SwapDataType["updateSelectedRate"];
};

function FromRow({
  fromAmount,
  setFromAmount,
  fromAccount,
  setFromAccount,
  isMaxEnabled,
  toggleMax,
  fromAmountError,
  fromAmountWarning,
  isSendMaxLoading,
  updateSelectedRate,
}: Props) {
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const accounts = useSwapableAccounts({ accounts: flattenedAccounts });
  const unit = useMaybeAccountUnit(fromAccount);
  const { t } = useTranslation();
  usePickDefaultAccount(accounts, fromAccount, setFromAccount);

  if (!fromAccount) return null;

  const trackEditAccount = () => {
    track("button_clicked2", {
      button: "Edit source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
  };

  const setAccountAndTrack = (account: AccountLike) => {
    updateSelectedRate();
    const name = account ? getDefaultAccountName(account) : undefined;
    track("button_clicked2", {
      button: "New source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      account: name,
    });
    setFromAccount(account);
  };

  const setValue = (fromAmount: BigNumber) => {
    track("button_clicked2", {
      button: "Amount input",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      amount: null,
    });
    updateSelectedRate();
    setFromAmount(fromAmount);
  };

  const toggleMaxAndTrack = (state: unknown) => {
    track("button_clicked2", {
      button: "max",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      state,
    });
    toggleMax();
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
            data-testid="swap-max-spendable-toggle"
          />
        </Box>
      </Box>
      <Box horizontal boxShadow="0px 2px 4px rgba(0, 0, 0, 0.05);">
        <Box width="50%" data-testid="origin-currency-dropdown">
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
        <InputSection width="50%" data-testid="origin-currency-amount">
          <InputCurrency
            loading={isSendMaxLoading}
            value={fromAmount}
            onChange={setValue}
            data-testid="origin-currency-amount-value"
            disabled={!fromAccount || isMaxEnabled}
            placeholder="0"
            textAlign="right"
            fontWeight={600}
            containerProps={amountInputContainerProps}
            unit={unit}
            // Flow complains if this prop is missing…
            renderRight={null}
          />
        </InputSection>
      </Box>

      {(!!fromAmountError || !!fromAmountWarning) && (
        <SwapStatusContainer isError={!!fromAmountError}>
          <WarningSolidMedium size={16} />
          <SwapStatusText fontWeight={500} fontFamily="Inter" fontSize={12} lineHeight="14px">
            <TranslatedError error={fromAmountError || fromAmountWarning} />
          </SwapStatusText>
        </SwapStatusContainer>
      )}
    </>
  );
}

export default React.memo<Props>(FromRow);
