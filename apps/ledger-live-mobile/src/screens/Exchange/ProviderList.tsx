import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { filterRampCatalogEntries } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import {
  PaymentServiceProvider,
  RampCatalogEntry,
  RampLiveAppCatalogEntry,
} from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import TrackScreen from "../../analytics/TrackScreen";
import LText from "../../components/LText";
import { ScreenName } from "../../const";
import ApplePay from "../../icons/ApplePay";
import ArrowRight from "../../icons/ArrowRight";
import GooglePay from "../../icons/GooglePay";
import Maestro from "../../icons/Maestro";
import MasterCard from "../../icons/MasterCard";
import PayPal from "../../icons/PayPal";
import Sepa from "../../icons/Sepa";
import Visa from "../../icons/Visa";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import { counterValueCurrencySelector } from "../../reducers/settings";
import AppIcon from "../Platform/AppIcon";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";

const assetMap: Partial<Record<PaymentServiceProvider, JSX.Element>> = {
  applepay: <ApplePay />,
  googlepay: <GooglePay />,
  maestro: <Maestro />,
  mastercard: <MasterCard />,
  paypal: <PayPal />,
  sepa: <Sepa />,
  visa: <Visa />,
};
type ProviderItemProps = {
  provider: RampLiveAppCatalogEntry;
  onClick: (
    provider: RampLiveAppCatalogEntry,
    icon?: string | null,
    name?: string | null,
  ) => void;
};

const ProviderItem = ({ provider, onClick }: ProviderItemProps) => {
  const [displayedPMs, setDisplayedPMs] = useState<PaymentServiceProvider[]>(
    provider.paymentProviders.slice(0, 4),
  );
  const { colors } = useTheme();
  const { t } = useTranslation();
  const manifest = useRemoteLiveAppManifest(provider.appId);
  const onItemClick = useCallback(() => {
    onClick(provider, manifest?.icon, manifest?.name);
  }, [provider, manifest, onClick]);
  const onMorePMsClick = useCallback(() => {
    setDisplayedPMs([...provider.paymentProviders]);
  }, [provider.paymentProviders]);

  if (!manifest) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onItemClick}
      style={[
        styles.itemRoot,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <TrackScreen category="Multibuy" name="ProviderList" />
      <View style={styles.itemLeft}>
        <View style={styles.itemHeader}>
          <AppIcon icon={manifest.icon} name={manifest.name} size={32} />
          <LText secondary style={styles.headerLabel}>
            {manifest.name}
          </LText>
        </View>
        <View style={styles.pmsRow}>
          {displayedPMs.map(paymentProvider => (
            <View
              key={paymentProvider}
              style={[
                styles.pm,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              {assetMap[paymentProvider] ? (
                assetMap[paymentProvider]
              ) : (
                <LText style={styles.pmLabel}>{paymentProvider}</LText>
              )}
            </View>
          ))}
          {provider.paymentProviders.length > 4 && displayedPMs.length <= 4 && (
            <TouchableOpacity
              onPress={onMorePMsClick}
              style={[
                styles.pm,
                {
                  borderColor: colors.border,
                },
              ]}
            >
              <LText style={styles.pmLabel}>
                {t("exchange.count", {
                  count: provider.paymentProviders.length - 4,
                })}
              </LText>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ArrowRight size={16} color={colors.grey} />
    </TouchableOpacity>
  );
};

type Props = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.ProviderList
>;

export default function ProviderList({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const rampCatalog = useRampCatalog();
  const { currency, type, accountId, accountAddress } = route.params;
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const filteredProviders = filterRampCatalogEntries(
    rampCatalog.value?.[type] || [],
    {
      cryptoCurrencies: currency.id ? [currency.id] : undefined,
    },
  );
  const onProviderClick = useCallback(
    (
      provider: RampCatalogEntry,
      icon?: string | null,
      name?: string | null,
    ) => {
      navigation.navigate(ScreenName.ProviderView, {
        provider,
        accountId,
        accountAddress,
        trade: {
          type,
          cryptoCurrencyId: currency.id,
          fiatCurrencyId: fiatCurrency.ticker,
          fiatAmount: 400,
        },
        icon,
        name,
      });
    },
    [
      navigation,
      accountId,
      accountAddress,
      type,
      currency.id,
      fiatCurrency.ticker,
    ],
  );
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
          paddingTop: extraStatusBarPadding,
        },
      ]}
    >
      <LText style={styles.title}>{t("exchange.providerList.title")}</LText>
      {filteredProviders.map(provider =>
        provider.type === "LIVE_APP" ? (
          <ProviderItem
            provider={provider}
            key={provider.name}
            onClick={onProviderClick}
          />
        ) : null,
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: "100%",
    display: "flex",
    flexDirection: "column",
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 24,
    marginBottom: 16,
    fontSize: 14,
  },
  itemRoot: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemLeft: {
    flex: 0.9,
  },
  itemHeader: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  pmsRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  pm: {
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 4,
  },
  pmLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
});
