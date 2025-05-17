import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AnalyticsPage, Entry, EntryPointNft } from "./types";
import { Row } from "./components/Row";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { entryPointConfig } from "./config";
type Props = {
  accountId: string;
  currencyId: string;
};

export default function useNftsEntryPointViewModel({ accountId, currencyId }: Props) {
  const { t } = useTranslation();
  const featureNftEntryPoint = useFeature("llNftEntryPoint");
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const chains =
    featureNftEntryPoint?.params?.chains?.map((chain: string) => chain.toLowerCase()) ?? [];

  const openLiveApp = (link: string, entry: Entry) => {
    track("entry_nft_clicked", { item: entry, page: AnalyticsPage.Account });

    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.PlatformApp,
      params: {
        platform: "nft-viewer-redirector",
        website: link,
        accountId,
        chainId: currencyId,
      },
    });
  };

  const handleRedirect = (entry: Entry) => {
    const { link } = entryPointConfig[entry];
    openLiveApp(link, entry);
  };

  const entryPoints: EntryPointNft = {
    [Entry.magiceden]: {
      enabled: featureNftEntryPoint?.params?.magiceden ?? false,
      page: AnalyticsPage.Account,
      component: () => (
        <Row
          title={t(entryPointConfig[Entry.magiceden].title)}
          entryPoint={Entry.magiceden}
          illustration={entryPointConfig[Entry.magiceden].illustration}
          link={entryPointConfig[Entry.magiceden].link}
          redirect={() => handleRedirect(Entry.magiceden)}
        />
      ),
    },
    [Entry.opensea]: {
      enabled: featureNftEntryPoint?.params?.opensea ?? false,
      page: AnalyticsPage.Account,
      component: () => (
        <Row
          title={t(entryPointConfig[Entry.opensea].title)}
          entryPoint={Entry.opensea}
          illustration={entryPointConfig[Entry.opensea].illustration}
          link={entryPointConfig[Entry.opensea].link}
          redirect={() => handleRedirect(Entry.opensea)}
        />
      ),
    },
  };

  return {
    isFeatureNftEntryPointEnabled: featureNftEntryPoint?.enabled ?? false,
    entryPoints,
    chains,
    currencyId,
  };
}
