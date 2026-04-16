import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useFiatRates } from "@ledgerhq/baanx";
import { addTopUp, addAgentTopUp } from "~/reducers/baanxTopUp";
import { counterValueCurrencySelector } from "~/reducers/settings";
import {
  Text,
  Button,
  NavBar,
  NavBarBackButton,
  NavBarContent,
  NavBarTitle,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  IconButton,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ChevronDown,
  TransferVertical,
  CheckmarkCircleFill,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { ScreenName } from "~/const";
import CurrencyIcon from "~/components/CurrencyIcon";
import InfiniteLoader from "~/components/InfiniteLoader";
import { NumberKeyboard } from "~/mvvm/features/Send/screens/Amount/components/NumberKeyboard";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaanxTopUpParamList } from "../types";

const BAANX_TO_LEDGER: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  XRP: "ripple",
};

const LOADING_DURATION_MS = 3000;

const FALLBACK_RATES: Record<string, number> = {
  btc: 65000,
  eth: 3200,
  xrp: 2.2,
  sol: 140,
  usdc: 1,
  usdt: 1,
};

type OverlayState = "idle" | "loading" | "success";

type Props = StackNavigatorProps<BaanxTopUpParamList, ScreenName.BaanxTopUpAmount>;

export function TopUpAmountScreen({ navigation, route }: Props) {
  const dispatch = useDispatch();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatTicker = counterValueCurrency.ticker ?? "EUR";
  const fiatSymbol = counterValueCurrency.symbol ?? fiatTicker;
  const { account, parentAccount, baanxAddress, coinTicker, agentId } = route.params;

  const hasAccount = account != null;
  const mainAccount = hasAccount ? getMainAccount(account, parentAccount) : null;
  const currency = hasAccount ? getAccountCurrency(account) : null;

  const fallbackCurrency = useMemo(() => {
    if (currency) return currency;
    const ledgerId = BAANX_TO_LEDGER[coinTicker.toUpperCase()];
    if (!ledgerId) return null;
    try {
      return getCryptoCurrencyById(ledgerId);
    } catch {
      return null;
    }
  }, [currency, coinTicker]);

  const unit = fallbackCurrency?.type !== "FiatCurrency" ? fallbackCurrency?.units[0] : null;
  const magnitude = unit?.magnitude ?? 8;

  const calcQuery = useMemo(
    () =>
      fallbackCurrency
        ? {
            from: fallbackCurrency,
            to: counterValueCurrency,
            value: 10 ** magnitude,
            disableRounding: true,
          }
        : { from: counterValueCurrency, to: counterValueCurrency, value: 1 },
    [fallbackCurrency, counterValueCurrency, magnitude],
  );
  const cvRate = useCalculate(calcQuery);
  const countervalueRate =
    typeof cvRate === "number" && fallbackCurrency ? cvRate / 10 ** magnitude : 0;

  const coinKey = coinTicker.toLowerCase();
  const geckoCoins = useMemo(() => [coinKey], [coinKey]);
  const geckoRates = useFiatRates(geckoCoins, fiatTicker.toLowerCase());
  const geckoRate = geckoRates[coinKey] ?? 0;

  const hardcodedRate = FALLBACK_RATES[coinKey] ?? 1;

  const coinToFiatRate = countervalueRate || geckoRate || hardcodedRate;

  const bridge = useMemo(
    () => (hasAccount ? getAccountBridge(account, parentAccount) : null),
    [hasAccount, account, parentAccount],
  );

  const bridgeTx = useBridgeTransaction(() => {
    if (!bridge || !mainAccount || !account) return { account: undefined };
    const tx = bridge.createTransaction(mainAccount);
    return {
      account,
      parentAccount,
      transaction: bridge.updateTransaction(tx, { recipient: baanxAddress }),
    };
  });

  const transaction = bridgeTx.transaction ?? null;
  const setTransaction = bridgeTx.setTransaction;
  const status = bridgeTx.status ?? null;

  const [inputValue, setInputValue] = useState("");
  const [isFiatMode, setIsFiatMode] = useState(false);
  const [overlayState, setOverlayState] = useState<OverlayState>("idle");

  const displayAmount = inputValue || "0";
  const ticker = fallbackCurrency?.ticker ?? coinTicker.toUpperCase();

  const primaryLabel = isFiatMode ? fiatSymbol : ticker;

  const secondaryText = useMemo(() => {
    const num = parseFloat(displayAmount) || 0;
    if (num === 0) return "";
    if (isFiatMode) {
      const cryptoEquiv = coinToFiatRate > 0 ? (num / coinToFiatRate).toFixed(6) : "…";
      return `≈ ${cryptoEquiv} ${ticker}`;
    }
    const fiatEquiv = coinToFiatRate > 0 ? (num * coinToFiatRate).toFixed(2) : "…";
    return `≈ ${fiatSymbol}${fiatEquiv}`;
  }, [displayAmount, isFiatMode, coinToFiatRate, ticker, fiatSymbol]);

  // --- Overlay animations ---
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const loaderSlide = useRef(new Animated.Value(30)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const successTextFade = useRef(new Animated.Value(0)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const showOverlay = useCallback(
    (nextState: OverlayState) => {
      setOverlayState(nextState);

      overlayOpacity.setValue(0);
      loaderOpacity.setValue(0);
      loaderSlide.setValue(30);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(loaderOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(loaderSlide, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    },
    [overlayOpacity, loaderOpacity, loaderSlide],
  );

  const transitionToSuccess = useCallback(() => {
    Animated.timing(loaderOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setOverlayState("success");

      checkScale.setValue(0);
      successTextFade.setValue(0);
      subtitleFade.setValue(0);
      buttonFade.setValue(0);

      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(successTextFade, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(subtitleFade, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(buttonFade, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]),
      ]).start();
    });
  }, [loaderOpacity, checkScale, successTextFade, subtitleFade, buttonFade]);

  useEffect(() => {
    if (overlayState !== "loading") return;
    const timer = setTimeout(transitionToSuccess, LOADING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [overlayState, transitionToSuccess]);

  // --- Amount input ---
  const handleKeyPress = useCallback(
    (key: string) => {
      setInputValue(prev => {
        let next: string;
        if (key === "delete") {
          next = prev.slice(0, -1);
        } else if (key === ".") {
          if (prev.includes(".")) return prev;
          next = prev ? `${prev}.` : "0.";
        } else {
          next = prev === "" || prev === "0" ? key : `${prev}${key}`;
        }

        if (bridge && transaction && setTransaction) {
          const numericValue = parseFloat(next || "0");
          const amount = new BigNumber(numericValue).times(new BigNumber(10).pow(magnitude));
          setTransaction(bridge.updateTransaction(transaction, { amount: amount.integerValue() }));
        }

        return next;
      });
    },
    [transaction, bridge, setTransaction, magnitude],
  );

  const handleToggleMode = useCallback(() => {
    setIsFiatMode(prev => !prev);
  }, []);

  const hasErrors = status?.errors?.amount != null;
  const inputNum = parseFloat(inputValue || "0");
  const canContinue = hasAccount
    ? transaction != null &&
      !hasErrors &&
      transaction.amount != null &&
      !transaction.amount.isZero()
    : inputNum > 0;

  const handleTopUp = useCallback(() => {
    if (hasAccount && transaction && status && mainAccount) {
      navigation.navigate(ScreenName.BaanxTopUpSelectDevice, {
        accountId: mainAccount.id,
        parentId: parentAccount?.id,
        transaction,
        status,
      });
    } else {
      const fiatValue = isFiatMode ? inputNum : inputNum * coinToFiatRate;
      if (agentId) {
        dispatch(addAgentTopUp({ agentId, amount: fiatValue }));
      } else {
        dispatch(addTopUp(fiatValue));
      }
      showOverlay("loading");
    }
  }, [
    navigation,
    hasAccount,
    transaction,
    status,
    mainAccount,
    parentAccount?.id,
    showOverlay,
    dispatch,
    inputNum,
    isFiatMode,
    coinToFiatRate,
    agentId,
  ]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleDone = useCallback(() => navigation.getParent()?.goBack(), [navigation]);

  const styles = useStyleSheet(
    t => ({
      root: { flex: 1, backgroundColor: t.colors.bg.base },
      amountContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: t.spacings.s16,
      },
      amountRow: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        justifyContent: "center",
      },
      amountText: {
        fontSize: 48,
        lineHeight: 60,
        fontWeight: "700",
        color: t.colors.text.base,
      },
      currencyLabel: {
        fontSize: 48,
        lineHeight: 60,
        fontWeight: "700",
        color: t.colors.text.muted,
        marginLeft: t.spacings.s8,
      },
      toggleButton: { position: "absolute" as const, right: 0 },
      coinSection: {
        marginHorizontal: t.spacings.s8,
        backgroundColor: t.colors.bg.muted,
        borderRadius: 12,
        marginBottom: t.spacings.s8,
      },
      bottom: { paddingHorizontal: t.spacings.s16, paddingBottom: t.spacings.s16 },
      errorText: { marginTop: t.spacings.s4 },
      centerContent: { alignItems: "center", justifyContent: "center" },
      loaderMargin: { marginBottom: t.spacings.s24 },
      checkIcon: { marginBottom: t.spacings.s16 },
      successSubtitle: { marginTop: t.spacings.s8 },
      overlayBottom: {
        position: "absolute" as const,
        bottom: t.spacings.s32,
        left: t.spacings.s16,
        right: t.spacings.s16,
      },
    }),
    [],
  );

  const accountName = mainAccount?.name ?? "Test mode";
  const coinLabel = fallbackCurrency?.name ?? coinTicker.toUpperCase();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <NavBar appearance="compact">
          <NavBarBackButton onPress={handleBack} accessibilityLabel="Back" />
          <NavBarContent>
            <NavBarTitle>Top up amount</NavBarTitle>
          </NavBarContent>
        </NavBar>

        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            <Text style={styles.amountText}>
              {isFiatMode ? `${fiatSymbol}${displayAmount}` : displayAmount}
            </Text>
            {!isFiatMode && <Text style={styles.currencyLabel}>{primaryLabel}</Text>}
            <View style={styles.toggleButton}>
              <IconButton
                icon={TransferVertical}
                size="xs"
                appearance="gray"
                accessibilityLabel="Toggle currency"
                onPress={handleToggleMode}
              />
            </View>
          </View>
          <Text typography="body2" lx={{ color: "muted" }}>
            {secondaryText}
          </Text>
          {hasErrors && (
            <Text typography="body3" lx={{ color: "error" }} style={styles.errorText}>
              Insufficient funds
            </Text>
          )}
        </View>

        <View style={styles.coinSection}>
          <ListItem>
            <ListItemLeading>
              {fallbackCurrency ? (
                <CurrencyIcon currency={fallbackCurrency} size={32} />
              ) : (
                <View style={{ width: 32, height: 32 }} />
              )}
              <ListItemContent>
                <ListItemTitle>{coinLabel}</ListItemTitle>
                <ListItemDescription>{accountName}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <ChevronDown size={20} />
            </ListItemTrailing>
          </ListItem>
        </View>

        <NumberKeyboard onKeyPress={handleKeyPress} allowDecimal />

        <View style={styles.bottom}>
          <Button appearance="base" size="lg" onPress={handleTopUp} disabled={!canContinue}>
            Top up
          </Button>
        </View>
      </SafeAreaView>

      {/* ---- Overlay ---- */}
      {overlayState !== "idle" && (
        <Animated.View style={[s.overlay, { opacity: overlayOpacity }]}>
          {/* Center: spinner or checkmark */}
          <View style={styles.centerContent}>
            {overlayState === "loading" && (
              <Animated.View
                style={[
                  styles.centerContent,
                  { opacity: loaderOpacity, transform: [{ translateY: loaderSlide }] },
                ]}
              >
                <View style={styles.loaderMargin}>
                  <InfiniteLoader size={48} />
                </View>
                <Text typography="heading2" lx={{ color: "base" }}>
                  Topping up
                </Text>
              </Animated.View>
            )}

            {overlayState === "success" && (
              <>
                <Animated.View style={[styles.checkIcon, { transform: [{ scale: checkScale }] }]}>
                  <CheckmarkCircleFill size={48} color="success" />
                </Animated.View>
                <Animated.View style={{ opacity: successTextFade }}>
                  <Text typography="heading2" lx={{ color: "base" }}>
                    Topped up
                  </Text>
                </Animated.View>
                {ticker && (
                  <Animated.View style={{ opacity: subtitleFade }}>
                    <Text typography="body2" lx={{ color: "muted" }} style={styles.successSubtitle}>
                      You'll see your {ticker} in a few seconds
                    </Text>
                  </Animated.View>
                )}
              </>
            )}
          </View>

          {overlayState === "success" && (
            <Animated.View style={[styles.overlayBottom, { opacity: buttonFade }]}>
              <Button appearance="base" size="lg" onPress={handleDone}>
                Done
              </Button>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
});
