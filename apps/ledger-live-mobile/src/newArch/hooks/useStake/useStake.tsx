import { useCallback, useMemo } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { ParamListBase, useNavigation, useRoute } from "@react-navigation/native";
import { useAnalytics } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { EntryOf } from "~/types/helpers";

export function useStake({
  currencyId,
  accountId,
  onClose,
}: {
  currencyId: CryptoCurrency["id"] | TokenCurrency["id"] | undefined;
  /** wallet API account id ?  */
  accountId?: Account["id"] | undefined;
  onClose?: (callback: () => void) => void;
}): {
  canStakeCurrency: boolean;
  canStakeUsingPlatformApp: boolean;
  canStakeUsingLedgerLive: boolean;
  navigationParams: EntryOf<BaseNavigatorStackParamList> | null;
  onStakePress: () => void;
  enabledCurrencies: string[];
  partnerSupportedTokens: string[];
} {
  const navigation = useNavigation<StackNavigationProp<ParamListBase, string, NavigatorName>>();
  const { track, page } = useAnalytics();
  const featureFlag = useFeature("stakePrograms");

  const enabledCurrencies = featureFlag?.params?.list || [];
  const redirects = featureFlag?.params?.redirects || {};
  const partnerSupportedTokens = Object.keys(redirects || []);

  const canStakeUsingPlatformApp = !currencyId
    ? false
    : partnerSupportedTokens.includes(currencyId);
  const canStakeUsingLedgerLive = !currencyId ? false : enabledCurrencies.includes(currencyId);
  const canStakeCurrency = canStakeUsingPlatformApp || canStakeUsingLedgerLive;

  const partner = !currencyId ? null : redirects[currencyId] ?? null;
  const localManifest = useLocalLiveAppManifest(partner?.platform);
  const remoteManifest = useRemoteLiveAppManifest(partner?.platform);
  const manifest: LiveAppManifest | undefined = remoteManifest || localManifest;

  const parentRoute = useRoute();

  const navigationParams: EntryOf<BaseNavigatorStackParamList> | null = useMemo(() => {
    console.log(`>> getting route.... Manifest: ${manifest?.id}`);

    if (canStakeUsingPlatformApp && manifest) {
      const customDappURL =
        partner?.queryParams &&
        appendQueryParamsToDappURL(manifest, partner.queryParams)?.toString();

      console.log(`>> getting route.... customDappURL: ${customDappURL}`);
      return [
        ScreenName.PlatformApp,
        {
          platform: manifest.id,
          name: manifest.name,
          accountId,
          yieldId: partner?.queryParams?.yieldId,
          chainId: partner?.queryParams?.chainId,
          customDappURL: customDappURL || undefined,
        },
      ];
    } else if (canStakeUsingLedgerLive || !currencyId) {
      console.log(`>> getting route.... StakeFlow`, { currencyId, parentRoute });
      return [
        NavigatorName.StakeFlow,
        {
          screen: ScreenName.Stake,
          params: {
            currencies: currencyId ? [currencyId] : undefined,
            accountId,
            parentRoute,
          },
        },
      ];
    }
    console.error(`>>> No staking route found for currencyId: ${currencyId}.`);
    return null;
  }, [
    canStakeUsingPlatformApp,
    manifest,
    canStakeUsingLedgerLive,
    partner?.queryParams,
    accountId,
    currencyId,
    parentRoute,
  ]);

  // FIXME: Probably do not need this, but this is an example how it will work in nav.
  const onSelectPlatformApp = useCallback(() => {
    console.log(`>>> useStake`, { manifest, provider: partner });

    if (manifest) {
      const customDappURL =
        partner?.queryParams &&
        appendQueryParamsToDappURL(manifest, partner.queryParams)?.toString();
      track("button_clicked", {
        button: partner?.platform,
        page,
      });
      onClose &&
        onClose(() => {
          navigation.navigate(ScreenName.PlatformApp, {
            platform: manifest.id,
            name: manifest.name,
            accountId,
            yieldId: partner?.queryParams?.yieldId,
            chainId: partner?.queryParams?.chainId,
            ...(customDappURL ? { customDappURL } : {}),
          });
        });
    }
  }, [manifest, partner, track, page, onClose, navigation, accountId]);

  return {
    enabledCurrencies,
    partnerSupportedTokens,
    canStakeCurrency,
    canStakeUsingPlatformApp,
    canStakeUsingLedgerLive,
    navigationParams,
    onStakePress: manifest
      ? onSelectPlatformApp
      : () => console.error(">>> No manifest. use normal stake flow."),
  };
}
