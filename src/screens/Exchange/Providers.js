// @flow

import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import SafeAreaView from "react-native-safe-area-view";
import { useNavigation } from "@react-navigation/native";

import type { AccountLike, Account } from "@ledgerhq/live-common/lib/types";

import { ScreenName } from "../../const";
import Button from "../../components/Button";
import LText from "../../components/LText";
import IconCoinify from "../../icons/providers/Coinify";
import IconWyre from "../../icons/providers/Wyre";

import Item from "./ProviderListItem";
import manifests from "./manifests";

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

const PROVIDERS = [
  {
    provider: "wyre",
    name: "Wyre",
    Icon: IconWyre,
    isDapp: true,
  },
  {
    provider: "coinify",
    name: "Coinify",
    Icon: IconCoinify,
    isDapp: false,
  },
];

const ExchangeProviders = ({ route }: { route: { params: RouteParams } }) => {
  const { params: routeParams } = route;
  const [selectedItem, setSelectedItem] = useState();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onContinue = useCallback(
    (provider: string) => {
      const conf = PROVIDERS.find(p => p.provider === provider);
      if (!conf) return;

      if (conf.isDapp) {
        const manifest = manifests[conf.provider];
        navigation.navigate(ScreenName.ExchangeDapp, { manifest });
      } else {
        navigation.navigate(ScreenName.Exchange, routeParams);
      }
    },
    [routeParams, navigation],
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView style={styles.providerList}>
        <LText style={styles.title} semiBold secondary>
          <Trans i18nKey={"transfer.exchange.providers.title"} />
        </LText>
        {PROVIDERS.map(p => {
          const bullets = t(
            `transfer.exchange.providers.${p.provider}.bullets`,
            {
              joinArrays: ";",
              defaultValue: "",
            },
          )
            .split(";")
            .filter(Boolean);

          return (
            <Item
              key={p.provider}
              id={p.provider}
              onSelect={setSelectedItem}
              selected={selectedItem}
              Icon={p.Icon}
              title={p.name}
              bullets={bullets}
            />
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          type={"primary"}
          title={t("transfer.exchange.providers.cta")}
          onPress={() => {
            selectedItem && onContinue(selectedItem);
          }}
          disabled={!selectedItem}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    marginVertical: 24,
  },
  providerList: {
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
  },
});

export default ExchangeProviders;
