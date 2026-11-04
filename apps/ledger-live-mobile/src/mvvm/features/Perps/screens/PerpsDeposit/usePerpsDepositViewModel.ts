import { useCallback, useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { CommonActions } from "@react-navigation/native";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit, valueFromUnit } from "@ledgerhq/live-common/currencies/index";
import { PERPS_UI_USE_CASE } from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";
import { PERPS_SWAPKIT_PROVIDER } from "@ledgerhq/live-common/wallet-api/Perps/constants";
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
import { getDepositSpendableBalance } from "@ledgerhq/live-common/wallet-api/Perps/deposit/coinErrors";
import { Linking } from "react-native";
import { useUrlLocalizer } from "LLM/hooks/useLocalizedUrls";
import {
  useCalculateCountervalueCallback,
  useCountervaluesCache,
} from "@features/platform-market-countervalues";
import { calculate } from "@domain/entity-market-countervalues";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import type { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/reducers/settings";
import { accountNameWithDefaultSelector, walletSelector } from "~/reducers/wallet";
import { useModularDrawerController } from "LLM/features/ModularDrawer";
import { useOpenBuySell } from "LLM/features/Buy";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import {
  PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
  PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
} from "../../constants/depositFunding";
import type { PerpsDepositOutcome } from "../../hooks/usePerpsDepositExecution";
import { cancelDepositRequest } from "@ledgerhq/live-common/wallet-api/Perps/deposit/request";
import type { PerpsReviewParams } from "./components/PerpsReview";
import { applyAmountKey, toAmountText } from "../../utils/amountKeys";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDeposit>
>;

export type PerpsDepositViewModel = Readonly<{
  headerDescription: string;
  amountText: string;
  depositAmount: number;
  formattedQuotedAmount: string;
  isQuoteLoading: boolean;
  counterValueCode: string;
  maxDecimalLength: number;
  pressAmountKey: (key: string) => void;
  selectAmountRatio: (amount: number) => void;
  depositCurrencyTicker: string;
  depositCurrencyLedgerId: string;
  depositAccountName: string | null;
  depositAccountCounterValue: string | null;
  maxAmount: number;
  maxBuffer: number;
  missingAccount: boolean;
  pickDepositAccount: () => void;
  handleReview: () => void;
  isReviewOpen: boolean;
  reviewParams: PerpsReviewParams | null;
  closeReview: () => void;
  isSignOpen: boolean;
  signingDevice: Device | null | undefined;
  selectSigningDevice: (device: Device | null | undefined) => void;
  handOverToDevice: () => void;
  /** The device declined, which is not a failure: the summary takes over again. */
  returnToReview: () => void;
  /** The sign step failed in a way the same deposit cannot fix, so the form takes over again. */
  returnToForm: () => void;
  /** Signed and broadcast, so the form gives way to the receipt. */
  endSigning: (outcome: PerpsDepositOutcome) => void;
}> &
  DepositFormErrors;

export function usePerpsDepositViewModel({
  navigation,
  route,
}: NavigationProps): PerpsDepositViewModel {
  const { receiverAccount } = route.params;

  const walletState = useSelector(walletSelector);
  const accounts = useSelector(flattenAccountsSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { openDrawer } = useModularDrawerController();
  const { openBuySellForAccount } = useOpenBuySell({ sourceScreenName: ScreenName.PerpsDeposit });
  const { isConnected, isInternetReachable } = useNetworkState();
  const isOffline = isConnected === false || isInternetReachable === false;

  const [depositAccountId, setDepositAccountId] = useState<string | undefined>(undefined);
  const [amountText, setAmountText] = useState("");
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [signingDevice, setSigningDevice] = useState<Device | null | undefined>();
  const [reviewParams, setReviewParams] = useState<PerpsReviewParams | null>(null);
  const [quoteRefreshGeneration, setQuoteRefreshGeneration] = useState(0);

  // Leaving the screen before the deposit settles abandons it; after it settles this is a no-op.
  useEffect(() => cancelDepositRequest, []);

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

  const depositAccount = useMemo(
    () => accounts.find(account => account.id === depositAccountId) ?? defaultDepositAccount,
    [accounts, depositAccountId, defaultDepositAccount],
  );

  const depositAmount = useMemo(() => {
    const parsed = Number(amountText.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountText]);

  const counterValueUnit = counterValueCurrency.units[0];

  const maxDecimalLength = Math.max(0, counterValueUnit.magnitude);

  /** Fills the input with the amount a ratio pill resolved to. */
  const selectAmountRatio = useCallback(
    (amount: number) => {
      setAmountText(toAmountText(amount, maxDecimalLength));
    },
    [maxDecimalLength],
  );

  const pressAmountKey = useCallback(
    (key: string) => {
      setAmountText(current => applyAmountKey(current, key, maxDecimalLength));
    },
    [maxDecimalLength],
  );

  const receiverCurrency = useMemo(() => getAccountCurrency(receiverAccount), [receiverAccount]);
  const depositCurrency = useMemo(
    () => (depositAccount ? getAccountCurrency(depositAccount) : undefined),
    [depositAccount],
  );

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

  const depositAccountBalanceCounterValue = useMemo(() => {
    if (!depositAccount || !depositCurrency) return null;
    return (
      calculateCountervalue(depositCurrency, getDepositSpendableBalance(depositAccount)) ?? null
    );
  }, [calculateCountervalue, depositAccount, depositCurrency]);

  const depositAccountCounterValue = useMemo(() => {
    if (!depositAccountBalanceCounterValue) return null;
    return formatCurrencyUnit(counterValueUnit, depositAccountBalanceCounterValue, {
      showCode: true,
      discreet,
      locale,
    });
  }, [counterValueUnit, depositAccountBalanceCounterValue, discreet, locale]);

  const maxAmount = useMemo(
    () =>
      depositAccountBalanceCounterValue?.shiftedBy(-counterValueUnit.magnitude).toNumber() ?? null,
    [counterValueUnit.magnitude, depositAccountBalanceCounterValue],
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
      openBuySellForAccount("buy", account, buyParentAccount);
      navigation.dispatch(current => {
        const routes = current.routes.filter(({ key }) => key !== route.key);
        return CommonActions.reset({ ...current, routes, index: routes.length - 1 });
      });
    },
    [navigation, openBuySellForAccount, route.key],
  );

  const localizeUrl = useUrlLocalizer();
  const openSupportUrl = useCallback(
    (url: string) => void Linking.openURL(localizeUrl(url)),
    [localizeUrl],
  );

  const { sentAmount, quote, isQuoteLoading, ...formErrors } = usePerpsDepositForm({
    accounts,
    receiverAccount,
    depositAccount,
    depositAmount,
    maxAmount,
    toCurrencyAmount,
    isOffline,
    refreshGeneration: quoteRefreshGeneration,
    counterValueCurrency: counterValueCurrency.ticker,
    locale,
    sourceCurrency: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    getAccountName,
    track,
    openBuy,
    openSupportUrl,
  });
  const { canReview } = formErrors;

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

  const pickDepositAccount = useCallback(() => {
    openDrawer({
      enableAccountSelection: true,
      areCurrenciesFiltered: false,
      uiUseCase: PERPS_UI_USE_CASE.fund,
      flow: PERPS_UI_USE_CASE.fund,
      onAccountSelected: account => {
        setDepositAccountId(account.id);
      },
    });
  }, [openDrawer]);

  const handleReview = useCallback(() => {
    if (!canReview || !depositAccount || !sentAmount || !quote) return;
    setReviewParams({
      depositAccount,
      receiverAccount,
      amountSent: sentAmount,
      amountTo: quote.amountTo.toFixed(),
      quoteId: quote.quoteId,
    });
    setIsReviewOpen(true);
  }, [canReview, depositAccount, quote, receiverAccount, sentAmount]);

  const closeReview = useCallback(() => setIsReviewOpen(false), []);

  const handOverToDevice = useCallback(() => {
    setIsReviewOpen(false);
    setIsSignOpen(true);
  }, []);

  const returnToReview = useCallback(() => {
    setIsSignOpen(false);
    setIsReviewOpen(true);
  }, []);

  const returnToForm = useCallback(() => {
    setQuoteRefreshGeneration(generation => generation + 1);
    setIsSignOpen(false);
  }, []);

  const endSigning = useCallback(
    ({ swapId }: PerpsDepositOutcome) => {
      setIsSignOpen(false);
      setSigningDevice(undefined);
      navigation.replace(ScreenName.PerpsTransactionSigned, {
        receiveCurrencyTicker: receiverCurrency.ticker,
        swapId,
        provider: PERPS_SWAPKIT_PROVIDER,
      });
    },
    [navigation, receiverCurrency.ticker],
  );

  return {
    headerDescription: `${receiverAccountName} · ${receiverAccountCounterValue}`,
    amountText,
    depositAmount,
    formattedQuotedAmount,
    isQuoteLoading,
    counterValueCode: counterValueUnit.code,
    maxDecimalLength,
    pressAmountKey,
    selectAmountRatio,
    depositCurrencyTicker: depositCurrency?.ticker ?? PERPS_DEPOSIT_DEFAULT_FUNDING_TICKER,
    depositCurrencyLedgerId: depositCurrency?.id ?? PERPS_DEPOSIT_DEFAULT_FUNDING_CURRENCY_ID,
    depositAccountName: depositAccount
      ? accountNameWithDefaultSelector(walletState, depositAccount)
      : null,
    depositAccountCounterValue,
    maxAmount: maxAmount ?? 0,
    maxBuffer,
    ...formErrors,
    missingAccount,
    pickDepositAccount,
    handleReview,
    isReviewOpen,
    reviewParams,
    closeReview,
    isSignOpen,
    signingDevice,
    selectSigningDevice: setSigningDevice,
    handOverToDevice,
    returnToReview,
    returnToForm,
    endSigning,
  };
}
