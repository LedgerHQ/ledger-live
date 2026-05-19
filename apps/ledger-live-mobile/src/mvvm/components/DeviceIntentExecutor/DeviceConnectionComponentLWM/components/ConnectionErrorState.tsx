import React from "react";
import { Linking } from "react-native";
import {
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { InfoState } from "LLM/components/InfoState";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { PeerRemovedPairingState } from "./PeerRemovedPairingState";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.ConnectionError }>;
};

type InfoStateProps = React.ComponentProps<typeof InfoState>;
type InfoStateCta = InfoStateProps["primaryCta"];

const connectionErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.connectionError.errors";

function assertNever(value: never): never {
  throw new Error(`Unhandled connection error type: ${JSON.stringify(value)}`);
}

export function ConnectionErrorState({ state }: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const bleForgetDeviceUrl = useLocalizedUrl(urls.errors.BleForgetDevice);
  const pairingIssuesUrl = useLocalizedUrl(urls.pairingIssues);
  const productName = t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  if (state.error.type === ConnectionErrorTypes.BlePairingPeerRemovedPairing) {
    const key = `${connectionErrorTranslationBaseKey}.blePairingPeerRemovedPairing`;

    return (
      <PeerRemovedPairingState
        title={t(`${key}.title`, { productName })}
        description={t(`${key}.description`, { productName })}
        helpLabel={t(`${key}.cta.help`)}
        retryLabel={t(`${key}.cta.retry`)}
        onHelp={() => {
          Linking.openURL(bleForgetDeviceUrl).catch(() => undefined);
        }}
        onRetry={state.retry}
      />
    );
  }

  const retryCta = (labelKey: string): InfoStateCta => ({
    label: t(labelKey),
    onPress: state.retry,
  });

  const helpCta = (labelKey: string, url: string): InfoStateCta => ({
    label: t(labelKey),
    onPress: () => {
      Linking.openURL(url).catch(() => undefined);
    },
  });

  const errorState: InfoStateProps = (() => {
    switch (state.error.type) {
      case ConnectionErrorTypes.BlePairingRefused: {
        const key = `${connectionErrorTranslationBaseKey}.blePairingRefused`;

        return {
          preset: "info",
          title: t(`${key}.title`),
          primaryCta: retryCta(`${key}.cta.retry`),
        };
      }

      case ConnectionErrorTypes.Unknown: {
        const key = `${connectionErrorTranslationBaseKey}.unknown`;

        return {
          preset: "error",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          banner: {
            title: t(`${key}.tip`),
          },
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: helpCta(`${key}.cta.help`, pairingIssuesUrl),
        };
      }

      default:
        return assertNever(state.error);
    }
  })();

  return <InfoState {...errorState} size="hug" />;
}
