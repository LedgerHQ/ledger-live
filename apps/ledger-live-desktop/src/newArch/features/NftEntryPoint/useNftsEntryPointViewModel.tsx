import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { AnalyticsPage, Entry, EntryPointNft } from "./types";
import { track } from "~/renderer/analytics/segment";
import { Row } from "./components/Row";
import React from "react";

import { useHistory } from "react-router-dom";
import { entryPointConfig } from "./config";

type Props = {
  accountId: string;
  currencyId: string;
};

export default function useNftsEntryPointViewModel({ accountId, currencyId }: Props) {
  const featureNftEntryPoint = useFeature("llNftEntryPoint");
  const history = useHistory();

  const chains =
    featureNftEntryPoint?.params?.chains?.map((chain: string) => chain.toLowerCase()) ?? [];

  const openLiveApp = (link: string, entry: Entry) => {
    track("entry_nft_clicked", { item: entry, page: AnalyticsPage.Account });

    history.push({
      pathname: "/platform/nft-viewer-redirector",
      state: {
        website: link,
        accountId,
        chainId: currencyId,
        returnTo: `/account/${accountId}`,
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
