import React from "react";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { mapQueryParamsForProvider } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { RampLiveAppCatalogEntry } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { languageSelector } from "../../reducers/settings";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";
import { TrackScreen } from "../../analytics";
import type {
  RootComposite,
  StackNavigatorProps,
} from "../../components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../const";

type Props = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.ProviderView>
>;
export default function ProviderView({ route }: Props) {
  const { provider, trade, accountId, accountAddress } = route.params;
  const manifest = useRemoteLiveAppManifest(
    (provider as RampLiveAppCatalogEntry).appId,
  );
  const { colors } = useTheme();
  const language = useSelector(languageSelector);
  const cryptoCurrency = provider.cryptoCurrencies.find(
    crypto => crypto.id === trade.cryptoCurrencyId,
  );
  const inputs = mapQueryParamsForProvider(
    provider as RampLiveAppCatalogEntry,
    {
      accountId,
      accountAddress,
      cryptoCurrencyId: cryptoCurrency ? cryptoCurrency.providerId : undefined,
      fiatCurrencyId: trade.fiatCurrencyId.toLocaleLowerCase(),
      primaryColor: colors.fog,
      mode: trade.type,
      theme: colors.fog,
      language,
      fiatAmount:
        typeof trade.fiatAmount === "undefined"
          ? undefined
          : String(trade.fiatAmount),
      cryptoAmount:
        typeof trade.cryptoAmount === "undefined"
          ? undefined
          : String(trade.cryptoAmount),
    },
  );
  return (
    <>
      <TrackScreen
        category="Multibuy"
        name="ProviderLiveApp"
        provider={(provider as RampLiveAppCatalogEntry).appId}
        trade={trade}
      />
      {manifest ? (
        <WebPlatformPlayer
          manifest={manifest as LiveAppManifest}
          inputs={inputs}
        />
      ) : null}
    </>
  );
}
