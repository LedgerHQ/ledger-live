import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AnalyticsPage, Entry, EntryPointNft } from "./types";
import { Row } from "./components/Row";
import React from "react";
import MagicEden from "~/images/liveApps/ME.webp";
import OpenSea from "~/images/liveApps/OS.webp";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

const entryPointConfig = {
  [Entry.magiceden]: {
    illustration: MagicEden,
    link: "https://magiceden.io",
  },
  [Entry.opensea]: {
    illustration: OpenSea,
    link: "https://opensea.io",
  },
};

type Props = {
  accountId: string;
  currencyId: string;
};

export default function useNftsEntryPointViewModel({ accountId, currencyId }: Props) {
  const featureNftEntryPoint = useFeature("llNftEntryPoint");
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  const chains =
    featureNftEntryPoint?.params?.chains?.map((chain: string) => chain.toLowerCase()) ?? [];

  const openLiveApp = (liveAppId: string, entry: Entry) => {
    track("entry_nft_clicked", { item: entry, page: AnalyticsPage.Account });

    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.PlatformApp,
      params: {
        platform: liveAppId,
        accountId,
        chainId: currencyId,
      },
    });
  };

  const entryPoints: EntryPointNft = {
    [Entry.magiceden]: {
      enabled: featureNftEntryPoint?.params?.magiceden ?? false,
      page: AnalyticsPage.Account,
      component: () => (
        <Row
          entryPoint={Entry.magiceden}
          illustration={entryPointConfig[Entry.magiceden].illustration}
          link={entryPointConfig[Entry.magiceden].link}
          redirect={() => openLiveApp("magic-eden", Entry.magiceden)}
        />
      ),
    },
    [Entry.opensea]: {
      enabled: featureNftEntryPoint?.params?.opensea ?? false,
      page: AnalyticsPage.Account,
      component: () => (
        <Row
          entryPoint={Entry.opensea}
          illustration={entryPointConfig[Entry.opensea].illustration}
          link={entryPointConfig[Entry.opensea].link}
          redirect={() => openLiveApp("opensea", Entry.opensea)}
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
