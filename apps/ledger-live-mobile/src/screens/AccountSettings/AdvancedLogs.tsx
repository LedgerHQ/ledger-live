import invariant from "invariant";
import React from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useSelector } from "react-redux";
import { Alert } from "@ledgerhq/native-ui";
import { getTagDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { accountScreenSelector } from "../../reducers/accounts";
import LText from "../../components/LText";
import NavigationScrollView from "../../components/NavigationScrollView";
import { localeIds } from "../../languages";
import { localeSelector } from "../../reducers/settings";

type Props = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  accountId: string;
};
export default function AdvancedLogs({ route }: Props) {
  const locale = useSelector(localeSelector);
  const { account } = useSelector(accountScreenSelector(route));
  const { t } = useTranslation();
  const usefulData = {
    xpub: account?.xpub || undefined,
    index: account?.index || undefined,
    freshAddressPath: account?.freshAddressPath || undefined,
    id: account?.id || undefined,
    blockHeight: account?.blockHeight || undefined,
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

  const currency = getAccountCurrency(account) as CryptoCurrency;
  const tag =
    account.derivationMode !== undefined &&
    account.derivationMode !== null &&
    getTagDerivationMode(currency, account.derivationMode);

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
