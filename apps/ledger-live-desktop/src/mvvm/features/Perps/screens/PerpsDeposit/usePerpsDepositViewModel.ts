import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import BigNumber from "bignumber.js";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  useCalculateCountervalueCallback,
  useCountervaluesCache,
} from "@features/platform-market-countervalues";
import { calculate } from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import type { PerpsDepositUiParams } from "@ledgerhq/live-common/wallet-api/Perps/server";
import { getDepositMaxBuffer } from "@ledgerhq/live-common/wallet-api/Perps/deposit/maxBuffer";
import { useFeature } from "@features/platform-feature-flags";
import { track } from "@shared/analytics";
import { useNetworkState } from "@shared/network-status";
import type { DepositBuyTarget } from "@ledgerhq/live-common/wallet-api/Perps/deposit/formError";
import {
  toConvertedDepositAmount,
  usePerpsDepositForm,
  type DepositFormErrors,
} from "@ledgerhq/live-common/wallet-api/Perps/deposit/useDepositFormErrors";
import { useUrlLocalizer } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { setFlowValue } from "~/renderer/reducers/modularDialog";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/renderer/reducers/wallet";
import { useOpenAssetAndAccount } from "LLD/features/ModularDialog/Web3AppWebview/AssetAndAccountDrawer";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import { openPerpsReview } from "../PerpsReview/PerpsReviewDialog";
import { applyRatio } from "LLD/features/Perps/utils/applyRatio";
import { buildBuyNavigationState } from "LLD/features/Market/utils/buyNavigation";

/** Snapshot of the amount-entry form, used to restore it when re-opened. */
export type PerpsDepositDraft = Readonly<{
  depositAccount: AccountLike;
  depositAmount: number;
}>;

export type PerpsDepositData = PerpsDepositUiParams & {
  draft?: PerpsDepositDraft;
};

const EMPTY_AMOUNT_TEXT = "0";

/** Serializes a computed amount (ratio, max, draft) as input text. */
function toAmountText(amount: number | undefined): string {
  return amount ? new BigNumber(amount).toFixed() : EMPTY_AMOUNT_TEXT;
}

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string | undefined;
  amountText: string;
  depositAmount: number;
  formattedQuotedAmount: string;
  isQuoteLoading: boolean;
  counterValueCode: string;
  maxDecimalLength: number;
  changeDepositAmount: (formattedValue: string) => void;
  selectAmountRatio: (amount: number) => void;
  depositCurrencyTicker: string;
  depositCurrencyLedgerId: string;
  depositAccountName: string | null;
  depositAccountCounterValue: string | null;
  maxAmount: number;
  maxBuffer: number;
  selectMax: () => void;
  missingAccount: boolean;
  pickDepositAccount: () => void;
  handleReview: () => void;
}> &
  DepositFormErrors;

export function usePerpsDepositViewModel(
  data: PerpsDepositData,
  onClose: () => void,
): PerpsDepositViewModel {
  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openAssetAndAccountPromise } = useOpenAssetAndAccount();
  const navigate = useNavigate();
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOffline = isConnected === false || isInternetReachable === false;

  const [depositAccountId, setDepositAccountId] = useState(data.draft?.depositAccount.id);
  const [amountText, setAmountText] = useState(() => toAmountText(data.draft?.depositAmount));
  const dispatch = useDispatch();

  useEffect(() => {
    setDepositAccountId(data.draft?.depositAccount.id);
    setAmountText(toAmountText(data.draft?.depositAmount));
  }, [data]);

  /** The input owns the text it displays; the number is derived for quoting and validation. */
  const depositAmount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  /** Fills the input with the amount a ratio pill resolved to. */
  const selectAmountRatio = useCallback(
    (amount: number) => setAmountText(toAmountText(amount)),
    [],
  );

  /** The USDC funding account with the highest spendable balance, used as the default. */
  const defaultDepositAccount = useMemo(
    () =>
      accounts
        .filter(
          (acc): acc is TokenAccount =>
            acc.type === "TokenAccount" &&
            acc.token.id === PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID &&
            acc.spendableBalance.gt(0),
        )
        .reduce<TokenAccount | undefined>(
          (best, acc) => (!best || acc.spendableBalance.gt(best.spendableBalance) ? acc : best),
          undefined,
        ),
    [accounts],
  );

  /** Read from the store so balances stay live while the form is open. */
  const depositAccount = useMemo(
    () => accounts.find(account => account.id === depositAccountId) ?? defaultDepositAccount,
    [accounts, depositAccountId, defaultDepositAccount],
  );

  const receiverAccount = data.receiverAccount;
  const receiverCurrency = useMemo(() => getAccountCurrency(receiverAccount), [receiverAccount]);
  const depositCurrency = useMemo(
    () => (depositAccount ? getAccountCurrency(depositAccount) : undefined),
    [depositAccount],
  );

  const counterValueUnit = counterValueCurrency.units[0];
  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const countervaluesState = useCountervaluesCache();

  /** Prices the typed amount back into `currency`, in its smallest unit. */
  const toCurrencyAmount = useCallback(
    (currency: CryptoOrTokenCurrency) =>
      toConvertedDepositAmount(
        calculate(countervaluesState, {
          from: currency,
          to: counterValueCurrency,
          value: new BigNumber(depositAmount).shiftedBy(counterValueUnit.magnitude).toNumber(),
          reverse: true,
          disableRounding: true,
        }),
      ),
    [counterValueCurrency, counterValueUnit.magnitude, countervaluesState, depositAmount],
  );

  const receiverAccountName = useMemo(
    () => accountNameWithDefaultSelector(walletState, receiverAccount),
    [receiverAccount, walletState],
  );

  const receiverAccountCounterValue = useMemo(() => {
    const counterValue =
      calculateCountervalue(receiverCurrency, receiverAccount.spendableBalance) ?? new BigNumber(0);
    return formatCurrencyUnit(counterValueUnit, counterValue, {
      showCode: true,
      discreet,
      locale,
    });
  }, [
    calculateCountervalue,
    counterValueUnit,
    discreet,
    locale,
    receiverAccount.spendableBalance,
    receiverCurrency,
  ]);

  const toFiatAmount = useCallback(
    (currency: CryptoOrTokenCurrency, atomicAmount: BigNumber) =>
      calculateCountervalue(currency, atomicAmount)
        ?.shiftedBy(-counterValueUnit.magnitude)
        .toNumber() ?? null,
    [calculateCountervalue, counterValueUnit.magnitude],
  );

  const tradeMaxConstant = useFeature("ptxTradeMaxConstant");
  const maxBuffer = useMemo(() => {
    if (!tradeMaxConstant?.enabled || !depositAccount || !depositCurrency) return 0;
    const buffer = getDepositMaxBuffer(depositAccount, tradeMaxConstant.params?.constants);
    if (buffer.isZero()) return 0;
    return (
      calculateCountervalue(depositCurrency, buffer)
        ?.shiftedBy(-counterValueUnit.magnitude)
        .toNumber() ?? 0
    );
  }, [
    calculateCountervalue,
    counterValueUnit.magnitude,
    depositAccount,
    depositCurrency,
    tradeMaxConstant,
  ]);

  const missingAccount = !depositAccount && depositAmount > 0;

  const getAccountName = useCallback(
    (account: AccountLike) => accountNameWithDefaultSelector(walletState, account),
    [walletState],
  );

  const openBuy = useCallback(
    ({ account, parentAccount: buyParentAccount }: DepositBuyTarget) => {
      navigate("/exchange", {
        state: buildBuyNavigationState({
          ledgerCurrency: getAccountCurrency(account),
          account,
          parentAccount: buyParentAccount,
        }),
      });
      onClose();
    },
    [navigate, onClose],
  );

  const localizeUrl = useUrlLocalizer();
  const openSupportUrl = useCallback((url: string) => openURL(localizeUrl(url)), [localizeUrl]);

  const { sentAmount, quote, isQuoteLoading, maxAmount, depositSpendableBalance, ...formErrors } =
    usePerpsDepositForm({
      accounts,
      receiverAccount,
      depositAccount,
      depositAmount,
      toCurrencyAmount,
      toFiatAmount,
      isOffline,
      counterValueCurrency: counterValueCurrency.ticker,
      locale,
      sourceCurrency: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
      getAccountName,
      track,
      openBuy,
      openSupportUrl,
    });
  const { canReview } = formErrors;

  const depositAccountCounterValue = useMemo(() => {
    if (!depositCurrency || !depositSpendableBalance) return null;
    const counterValue = calculateCountervalue(depositCurrency, depositSpendableBalance);
    if (!counterValue) return null;
    return formatCurrencyUnit(counterValueUnit, counterValue, {
      showCode: true,
      discreet,
      locale,
    });
  }, [
    calculateCountervalue,
    counterValueUnit,
    depositCurrency,
    depositSpendableBalance,
    discreet,
    locale,
  ]);

  const selectMax = useCallback(() => {
    if (maxAmount === null) return;
    setAmountText(toAmountText(applyRatio(maxAmount, 1, maxDecimalLength, maxBuffer)));
  }, [maxAmount, maxBuffer, maxDecimalLength]);

  const receiverUnit = receiverCurrency.units[0];

  const formattedQuotedAmount = useMemo(
    () =>
      quote
        ? formatCurrencyUnit(receiverUnit, valueFromUnit(quote.amountTo, receiverUnit), {
            showCode: true,
            locale,
          })
        : "",
    [locale, quote, receiverUnit],
  );

  const changeDepositAmount = useCallback((formattedValue: string) => {
    setAmountText(formattedValue === "" ? EMPTY_AMOUNT_TEXT : formattedValue);
  }, []);

  const pickDepositAccount = useCallback(() => {
    dispatch(setFlowValue(PERPS_UI_USE_CASE.fund));
    void openAssetAndAccountPromise({
      uiUseCase: PERPS_UI_USE_CASE.fund,
      areCurrenciesFiltered: false,
    })
      .then(({ account }) => {
        setDepositAccountId(account.id);
      })
      .catch(() => undefined);
  }, [dispatch, openAssetAndAccountPromise]);

  const handleReview = useCallback(() => {
    if (!canReview || !depositAccount || !depositCurrency || !quote) return;

    openPerpsReview({
      receiverAccount,
      depositAccount,
      amountSent: sentAmount,
      amountTo: quote.amountTo.toFixed(),
      quoteId: quote.quoteId,
      draft: { depositAccount, depositAmount },
    });
    onClose();
  }, [
    canReview,
    depositAccount,
    depositAmount,
    depositCurrency,
    onClose,
    quote,
    receiverAccount,
    sentAmount,
  ]);

  const headerDescription = `${receiverAccountName} · ${receiverAccountCounterValue}`;

  return {
    headerDescription,
    amountText,
    depositAmount,
    formattedQuotedAmount,
    isQuoteLoading,
    counterValueCode: counterValueUnit.code,
    maxDecimalLength,
    changeDepositAmount,
    selectAmountRatio,
    depositCurrencyTicker: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    depositCurrencyLedgerId: depositCurrency?.id ?? PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
    depositAccountName: depositAccount
      ? accountNameWithDefaultSelector(walletState, depositAccount)
      : null,
    depositAccountCounterValue,
    maxAmount: maxAmount ?? 0,
    maxBuffer,
    selectMax,
    ...formErrors,
    missingAccount,
    pickDepositAccount,
    handleReview,
  };
}
