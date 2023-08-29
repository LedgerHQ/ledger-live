import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getAccountUnit, getAccountName } from "@ledgerhq/live-common/account/index";
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
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TranslatedError } from "~/renderer/components/TranslatedError/TranslatedError";
import { WarningSolidMedium } from "@ledgerhq/react-ui/assets/icons";
import { useSwapContext } from "@ledgerhq/live-common/exchange/swap/hooks/index";

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
  isMaxEnabled,
  toggleMax,
  fromAmountError,
  fromAmountWarning,
  isSendMaxLoading,
  updateSelectedRate,
}: Props) {
  const { setFromCurrencyAmount, fromCurrencyAmount, fromCurrencyAccount, setFromCurrencyAccount } =
    useSwapContext();
  const swapDefaultTrack = useGetSwapTrackingProperties();
  const accounts = useSelector(fromSelector)(useSelector(shallowAccountsSelector));
  const unit = fromCurrencyAccount && getAccountUnit(fromCurrencyAccount);
  const { t } = useTranslation();
  const trackEditAccount = () =>
    track("button_clicked", {
      button: "Edit source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
    });
  const setAccountAndTrack = (account: AccountLike) => {
    updateSelectedRate();
    const name = account ? getAccountName(account) : undefined;
    track("button_clicked", {
      button: "New source account",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      account: name,
    });
    setFromCurrencyAccount(account);
  };
  const setValue = (fromAmount: BigNumber) => {
    track("button_clicked", {
      button: "Amount input",
      page: "Page Swap Form",
      ...swapDefaultTrack,
      amount: null,
    });
    updateSelectedRate();
    setFromCurrencyAmount(fromAmount);
  };
  const toggleMaxAndTrack = (state: unknown) => {
    track("button_clicked", {
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
            disabled={!fromCurrencyAccount}
            data-test-id="swap-max-spendable-toggle"
          />
        </Box>
      </Box>
      <Box horizontal boxShadow="0px 2px 4px rgba(0, 0, 0, 0.05);">
        <Box width="50%">
          <SelectAccount
            accounts={accounts}
            value={fromCurrencyAccount}
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
            value={fromCurrencyAmount}
            onChange={setValue}
            disabled={!fromCurrencyAccount || isMaxEnabled}
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
