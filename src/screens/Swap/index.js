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
// import IconWyre from "../../../icons/providers/Wyre";
import IconChangelly from "../../icons/providers/Changelly";
import IconParaswap from "../../icons/providers/Paraswap";

import Item from "./ProviderListItem";
import useManifests from "./manifests";

type RouteParams = {
  defaultAccount: ?AccountLike,
  defaultParentAccount: ?Account,
};

const PROVIDERS = [
  // {
  //   provider: "wyre",
  //   name: "Wyre",
  //   isDapp: false,
  //   Icon: IconWyre,
  //   kycRequired: true,
  // },
  {
    provider: "paraswap",
    name: "ParaSwap",
    isDapp: true,
    Icon: IconParaswap,
    kycRequired: false,
  },
  {
    provider: "changelly",
    name: "Changelly",
    isDapp: false,
    Icon: IconChangelly,
    kycRequired: false,
  },
];

if (__DEV__) {
  PROVIDERS.push({
    provider: "debug",
    name: "Debugger",
    isDapp: true,
    kycRequired: false,
    Icon: null,
  });
}

const SwapProviders = ({ route }: { route: { params: RouteParams } }) => {
  const { params: routeParams } = route;
  const [selectedItem, setSelectedItem] = useState();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const manifests = useManifests();

  const onContinue = useCallback(
    (provider: string) => {
      const conf = PROVIDERS.find(p => p.provider === provider);
      if (!conf) return;

      if (conf.isDapp) {
        const manifest = manifests[conf.provider];
        navigation.navigate(ScreenName.SwapDapp, { manifest });
      } else {
        // TODO: do the Wyre provider logic
        navigation.navigate(ScreenName.SwapFormOrHistory, routeParams);
      }
    },
    [routeParams, navigation],
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView style={styles.providerList}>
        <LText style={styles.title} semiBold secondary>
          <Trans i18nKey={"transfer.swap.providers.title"} />
        </LText>
        {PROVIDERS.map(p => {
          const bullets = t(`transfer.swap.providers.${p.provider}.bullets`, {
            joinArrays: ";",
            defaultValue: "",
          })
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
              kyc={p.kycRequired}
            />
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          type={"primary"}
          title={t("transfer.swap.providers.cta")}
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

export default SwapProviders;
