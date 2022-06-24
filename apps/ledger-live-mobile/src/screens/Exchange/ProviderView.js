// @flow

import React from "react";
import { RampLiveAppCatalogEntry } from "@ledgerhq/live-common/lib/platform/providers/RampCatalogProvider/types";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/lib/platform/providers/RemoteLiveAppProvider";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { mapQueryParamsForProvider } from "@ledgerhq/live-common/lib/platform/providers/RampCatalogProvider/helpers";
import { languageSelector } from "../../reducers/settings";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";
import { TrackScreen } from "../../analytics";

type TradeParams = {
  type: "onRamp" | "offRamp",
  cryptoCurrencyId: string,
  fiatCurrencyId: string,
  fiatAmount?: number,
  cryptoAmount?: number,
};

type ProviderViewProps = {
  navigation: any,
  route: { params: RouteParams, name: string },
};

type RouteParams = {
  provider: RampLiveAppCatalogEntry,
  accountId: string,
  accountAddress: string,
  trade: TradeParams,
  icon: string,
  name: string,
};

export default function ProviderView({ route }: ProviderViewProps) {
  const { provider, trade, accountId, accountAddress } = route.params;
  const manifest = useRemoteLiveAppManifest(provider.appId);
  const { colors } = useTheme();
  const language = useSelector(languageSelector);
  const cryptoCurrency = provider.cryptoCurrencies.find(
    crypto => crypto.id === trade.cryptoCurrencyId,
  );
  const inputs = mapQueryParamsForProvider(provider, {
    accountId,
    accountAddress,
    cryptoCurrencyId: cryptoCurrency ? cryptoCurrency.providerId : undefined,
    fiatCurrencyId: trade.fiatCurrencyId.toLocaleLowerCase(),
    primaryColor: colors.fog,
    mode: trade.type,
    theme: colors.fog,
    language,
    fiatAmount: trade.fiatAmount,
    cryptoAmount: trade.cryptoAmount,
  });

  return (
    <>
      <TrackScreen
        category="Multibuy"
        name="ProviderLiveApp"
        provider={provider.appId}
        trade={trade}
      />
      <WebPlatformPlayer
        onClose={() => {}}
        manifest={manifest}
        inputs={inputs}
      />
    </>
  );
}
