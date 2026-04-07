import React, { useCallback } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import i18next from "i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import LText from "~/components/LText";
import {
  FEE_CURRENCY_BY_CONTRACT,
  FEE_CURRENCY_OPTIONS,
} from "@ledgerhq/live-common/families/celo/logic";
import type { TokenAccount } from "@ledgerhq/types-live";
import type {
  CeloAccount,
  Transaction as CeloTransaction,
} from "@ledgerhq/live-common/families/celo/types";
import { popToScreen } from "~/helpers/navigationHelpers";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.CeloEditFeeCurrency>
>;

function CeloEditFeeCurrency({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, transaction } = route.params;
  const celoAccount = account as CeloAccount;
  const celoTransaction = transaction as CeloTransaction;

  // Collect available fee currency options: native CELO + supported token sub-accounts
  const tokenAccounts: (TokenAccount & { feeCurrencyName: string })[] = (
    celoAccount.subAccounts ?? []
  )
    .filter((sub): sub is TokenAccount => sub.type === "TokenAccount")
    .filter(sub => FEE_CURRENCY_BY_CONTRACT.has(sub.token.contractAddress.toLowerCase()))
    .map(sub => ({
      ...sub,
      feeCurrencyName:
        FEE_CURRENCY_BY_CONTRACT.get(sub.token.contractAddress.toLowerCase())?.name ??
        sub.token.name,
    }));

  const onSelectNative = useCallback(() => {
    const bridge = getAccountBridge(celoAccount);
    const updatedTx = bridge.updateTransaction(celoTransaction, {
      feeCurrency: null,
      feeCurrencyUnwrapped: null,
      feeCurrencyAccountId: null,
    });
    popToScreen(navigation, ScreenName.SendSummary, {
      ...route.params,
      accountId: celoAccount.id,
      transaction: updatedTx,
    });
  }, [navigation, route.params, celoAccount, celoTransaction]);

  const onSelectToken = useCallback(
    (tokenAccount: TokenAccount) => {
      const bridge = getAccountBridge(celoAccount);
      const contractAddress = tokenAccount.token.contractAddress;
      const matchedOption = FEE_CURRENCY_BY_CONTRACT.get(contractAddress.toLowerCase());
      const feeCurrency = matchedOption?.adapterAddress ?? matchedOption?.contractAddress ?? null;
      const feeCurrencyUnwrapped = matchedOption?.contractAddress ?? null;

      const updatedTx = bridge.updateTransaction(celoTransaction, {
        feeCurrency,
        feeCurrencyUnwrapped,
        feeCurrencyAccountId: tokenAccount.id,
      });
      popToScreen(navigation, ScreenName.SendSummary, {
        ...route.params,
        accountId: celoAccount.id,
        transaction: updatedTx,
      });
    },
    [navigation, route.params, celoAccount, celoTransaction],
  );

  const nativeName = FEE_CURRENCY_OPTIONS[0].name;
  const isNativeSelected = !celoTransaction.feeCurrencyAccountId;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={[
            styles.option,
            {
              borderColor: isNativeSelected ? colors.live : colors.lightGrey,
              backgroundColor: isNativeSelected ? colors.lightLive : colors.card,
            },
          ]}
          onPress={onSelectNative}
        >
          <LText semiBold style={styles.optionText}>
            {nativeName}
          </LText>
          {isNativeSelected && (
            <LText style={styles.checkmark} color="live">
              ✓
            </LText>
          )}
        </TouchableOpacity>

        {tokenAccounts.map(tokenAccount => {
          const isSelected = celoTransaction.feeCurrencyAccountId === tokenAccount.id;
          return (
            <TouchableOpacity
              key={tokenAccount.id}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.live : colors.lightGrey,
                  backgroundColor: isSelected ? colors.lightLive : colors.card,
                },
              ]}
              onPress={() => onSelectToken(tokenAccount)}
            >
              <View style={styles.optionContent}>
                <LText semiBold style={styles.optionText}>
                  {tokenAccount.feeCurrencyName}
                </LText>
              </View>
              {isSelected && (
                <LText style={styles.checkmark} color="live">
                  ✓
                </LText>
              )}
            </TouchableOpacity>
          );
        })}

        {tokenAccounts.length === 0 && (
          <LText style={styles.emptyText} color="grey">
            {t("celo.send.feeCurrencyOnlyNative")}
          </LText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const options = {
  title: i18next.t("celo.send.feeCurrency"),
};

export { CeloEditFeeCurrency as component, options };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 18,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
  },
});
