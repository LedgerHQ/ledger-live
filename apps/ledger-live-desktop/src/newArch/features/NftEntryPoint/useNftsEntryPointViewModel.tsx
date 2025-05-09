import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AnalyticsPage, Entry, EntryPointNft } from "./types";
import { track } from "~/renderer/analytics/segment";
import { Row } from "./components/Row";
import React from "react";
import MagicEden from "./assets/magiceden.svg";
import OpenSea from "./assets/opensea.svg";
import { useHistory } from "react-router-dom";

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

export default function useNftsEntryPointViewModel() {
  const featureNftEntryPoint = useFeature("llNftEntryPoint");
  const history = useHistory();

  const chains =
    featureNftEntryPoint?.params?.chains?.map((chain: string) => chain.toUpperCase()) ?? [];

  const openLiveApp = (liveAppId: string, entry: Entry) => {
    track("entry_nft_clicked", { item: entry, page: AnalyticsPage.Account });
    history.push(`/platform/${liveAppId}`);
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
  };
}
