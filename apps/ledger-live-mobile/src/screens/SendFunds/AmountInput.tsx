import React, { useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSendAmount } from "@ledgerhq/live-countervalues-react";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { counterValueCurrencySelector } from "~/reducers/settings";
import LText from "~/components/LText/index";
import CounterValuesSeparator from "./CounterValuesSeparator";
import CurrencyInput from "~/components/CurrencyInput";
import TranslatedError from "~/components/TranslatedError";

type Props = {
  account: AccountLike;
  value: BigNumber;
  onChange: (_: BigNumber) => void;
  error?: Error | null | undefined;
  warning?: Error | null | undefined;
  editable?: boolean;
  testID?: string;
  fiatTestID?: string;
};
export default function AmountInput({
  onChange,
  value: cryptoAmount,
  account,
  error,
  warning,
  editable,
  testID,
  fiatTestID,
}: Props) {
  const { t } = useTranslation();
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const { cryptoUnit, fiatAmount, fiatUnit, calculateCryptoAmount } = useSendAmount({
    account,
    fiatCurrency,
    cryptoAmount,
  });
  const [active, setActive] = useState<"crypto" | "fiat" | "none">("none");
  const onChangeFiatAmount = useCallback(
    (fiatAmount: BigNumber) => {
      const amount = calculateCryptoAmount(fiatAmount);
      onChange(amount);
    },
    [onChange, calculateCryptoAmount],
  );
  const onCryptoFieldFocus = useCallback(() => {
    setActive("crypto");
    track("SendAmountCryptoFocused");
  }, []);
  const onFiatFieldFocus = useCallback(() => {
    setActive("fiat");
    track("SendAmountFiatFocused");
  }, []);
  const isCrypto = active === "crypto";
  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <CurrencyInput
          testID={testID}
          editable={editable}
          isActive={isCrypto}
          onFocus={onCryptoFieldFocus}
          onChange={onChange}
          unit={cryptoUnit}
          value={cryptoAmount}
          renderRight={
            <LText style={[styles.currency, isCrypto ? styles.active : null]} semiBold color="grey">
              {cryptoUnit.code}
            </LText>
          }
          hasError={!!error}
          hasWarning={!!warning}
        />
        <LText
          style={[error ? styles.error : styles.warning]}
          color={error ? "alert" : "orange"}
          numberOfLines={2}
        >
          <TranslatedError error={error || warning} />
        </LText>
      </View>
      <CounterValuesSeparator />
      <View style={styles.wrapper}>
        <CurrencyInput
          testID={fiatTestID}
          isActive={!isCrypto}
          onFocus={onFiatFieldFocus}
          onChange={onChangeFiatAmount}
          unit={fiatUnit}
          value={cryptoAmount ? fiatAmount : null}
          placeholder={!fiatAmount ? t("send.amount.noRateProvider") : undefined}
          editable={!!fiatAmount && editable}
          showAllDigits
          renderRight={
            <LText
              style={[styles.currency, !isCrypto ? styles.active : null]}
              semiBold
              color="grey"
            >
              {fiatUnit.code}
            </LText>
          }
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flexBasis: 100,
    flexShrink: 0.5,
    flexDirection: "column",
    justifyContent: "center",
  },
  currency: {
    fontSize: 24,
  },
  active: {
    fontSize: 32,
  },
  error: {
    fontSize: 14,
  },
  warning: {
    fontSize: 14,
  },
});
