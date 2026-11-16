import React from "react";
import { Linking } from "react-native";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { InfoState } from "@shared/ui-info-state";
import { getProviderName } from "@ledgerhq/live-common/exchange/swap/utils/index";
import type { ShowExchangeErrorIntentJobState } from "@ledgerhq/live-common/exchange/intents/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { SWAP_NANO_S_INCOMPATIBILITY_PAGE } from "~/components/DeviceAction/ThorSwapIncompatibility";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";

type IncompatibleDeviceStateProps = Readonly<{
  state: Extract<ShowExchangeErrorIntentJobState, { type: "incompatible-device" }>;
  onClose: () => void;
}>;

/** The device cannot do this swap: send the user to a device that can, or another provider. */
export function IncompatibleDeviceState({ state, onClose }: IncompatibleDeviceStateProps) {
  const { t } = useTranslation();
  const hardwareWalletUrl = useLocalizedUrl(urls.hardwareWallet);
  const { provider, sourceCurrencyId, targetCurrencyId } = state;

  const trackingProperties = {
    flow: "swap",
    deviceModel: "nanoS",
    variant: "provider",
    provider,
    ...(sourceCurrencyId ? { sourceCurrency: sourceCurrencyId } : {}),
    ...(targetCurrencyId ? { targetCurrency: targetCurrencyId } : {}),
  };

  const trackButton = (button: string) =>
    track("button_clicked", {
      button,
      page: SWAP_NANO_S_INCOMPATIBILITY_PAGE,
      ...trackingProperties,
    });

  return (
    <>
      <TrackScreen category={SWAP_NANO_S_INCOMPATIBILITY_PAGE} {...trackingProperties} />
      <InfoState
        preset="error"
        size="hug"
        title={t("transfer.swap2.wrongDevice.title", { provider: getProviderName(provider) })}
        description={t("transfer.swap2.wrongDevice.description", { provider })}
        primaryCta={{
          label: t("transfer.swap2.wrongDevice.explore_compatible_devices"),
          onPress: () => {
            trackButton("explore_compatible_devices");
            Linking.openURL(hardwareWalletUrl).catch(() => undefined);
          },
          testID: "wallet-api-exchange-incompatible-device-explore",
        }}
        secondaryCta={{
          label: t("transfer.swap2.wrongDevice.swapWithAnotherProvider"),
          onPress: () => {
            trackButton("swap_with_another_provider");
            onClose();
          },
          testID: "wallet-api-exchange-incompatible-device-other-provider",
        }}
        testID="wallet-api-exchange-incompatible-device"
      />
    </>
  );
}
