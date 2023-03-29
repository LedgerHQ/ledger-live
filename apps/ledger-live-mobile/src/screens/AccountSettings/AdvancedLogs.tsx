import invariant from "invariant";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Alert } from "@ledgerhq/native-ui";
import {
  getTagDerivationMode,
  DerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import {
  getAccountCurrency,
  isAccount,
} from "@ledgerhq/live-common/account/index";
import { accountScreenSelector } from "../../reducers/accounts";
import LText from "../../components/LText";
import NavigationScrollView from "../../components/NavigationScrollView";
import { localeIds } from "../../languages";
import { localeSelector } from "../../reducers/settings";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import { AccountSettingsNavigatorParamList } from "../../components/RootNavigator/types/AccountSettingsNavigator";
import { ScreenName } from "../../const";

type NavigationProps = BaseComposite<
  StackNavigatorProps<
    AccountSettingsNavigatorParamList,
    ScreenName.AdvancedLogs
  >
>;

export default function AdvancedLogs({ route }: NavigationProps) {
  const locale = useSelector(localeSelector);
  const { account } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const usefulData = {
    xpub: (isAccount(account) && account?.xpub) || undefined,
    index: (isAccount(account) && account?.index) || undefined,
    freshAddressPath:
      (isAccount(account) && account?.freshAddressPath) || undefined,
    id: account?.id || undefined,
    blockHeight: (isAccount(account) && account?.blockHeight) || undefined,
  };
  invariant(account?.type === "Account", "account must be a main account");
  const locales = [locale, ...localeIds];
  const readableDate = account.lastSyncDate.toLocaleDateString(locales, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const currency = getAccountCurrency(account);
  const tag =
    (account.derivationMode !== undefined &&
      account.derivationMode !== null &&
      currency.type === "CryptoCurrency" &&
      getTagDerivationMode(
        currency,
        (account as { derivationMode: DerivationMode }).derivationMode,
      )) ||
    null;

  return (
    <NavigationScrollView>
      <View style={styles.body}>
        {tag && (
          <Alert
            type="info"
            title={t("account.settings.advanced.warningDerivation", {
              tag,
            })}
          />
        )}

        <LText semiBold style={styles.sync} mt="16px">
          {t("common.sync.ago", {
            time: readableDate,
          })}
        </LText>
        <LText selectable monospace style={styles.mono}>
          {JSON.stringify(usefulData, null, 2)}
        </LText>
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    flexDirection: "column",
    flex: 1,
    padding: 16,
    paddingBottom: 64,
  },
  sync: {
    marginBottom: 16,
  },
  mono: {
    fontSize: 14,
  },
});
