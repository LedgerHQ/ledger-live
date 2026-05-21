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

type ConnectionErrorViewState = {
  preset: "info" | "error";
  title: string;
  description?: string;
  banner?: {
    title: string;
  };
  primaryCta?: InfoStateCta;
  secondaryCta?: InfoStateCta;
};

type BlePairingPeerRemovedPairingViewState = {
  title: string;
  description: string;
  helpLabel: string;
  retryLabel: string;
};

type ConnectionErrorViewStates = {
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]: BlePairingPeerRemovedPairingViewState
} & Record<Exclude<ConnectionErrorTypes, ConnectionErrorTypes.BlePairingPeerRemovedPairing>, ConnectionErrorViewState>;

const connectionErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.connectionError.errors";

export function ConnectionErrorState({ state }: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const bleForgetDeviceUrl = useLocalizedUrl(urls.errors.BleForgetDevice);
  const pairingIssuesUrl = useLocalizedUrl(urls.pairingIssues);
  const productName = t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

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

  const connectionErrorViewStates: ConnectionErrorViewStates = {
    [ConnectionErrorTypes.BlePairingRefused]: {
      preset: "info",
      title: `${connectionErrorTranslationBaseKey}.blePairingRefused.title`,
      primaryCta: retryCta(`${connectionErrorTranslationBaseKey}.blePairingRefused.cta.retry`),
    },
    [ConnectionErrorTypes.Unknown]: {
      preset: "error",
      title: `${connectionErrorTranslationBaseKey}.unknown.title`,
      description: `${connectionErrorTranslationBaseKey}.unknown.description`,
      banner: {
        title: `${connectionErrorTranslationBaseKey}.unknown.tip`,
      },
      primaryCta: retryCta(`${connectionErrorTranslationBaseKey}.unknown.cta.retry`),
      secondaryCta: helpCta(`${connectionErrorTranslationBaseKey}.unknown.cta.help`, pairingIssuesUrl),
    },
    [ConnectionErrorTypes.BlePairingPeerRemovedPairing]: {
      title: `${connectionErrorTranslationBaseKey}.blePairingPeerRemovedPairing.title`,
      description: `${connectionErrorTranslationBaseKey}.blePairingPeerRemovedPairing.description`,
      helpLabel: `${connectionErrorTranslationBaseKey}.blePairingPeerRemovedPairing.cta.help`,
      retryLabel: `${connectionErrorTranslationBaseKey}.blePairingPeerRemovedPairing.cta.retry`,
    },
  };

  if (state.error.type === ConnectionErrorTypes.BlePairingPeerRemovedPairing) {
    const errorState = connectionErrorViewStates[state.error.type];

    return (
      <PeerRemovedPairingState
        title={t(errorState.title, { productName })}
        description={t(errorState.description, { productName })}
        helpLabel={t(errorState.helpLabel)}
        retryLabel={t(errorState.retryLabel)}
        onHelp={() => {
          Linking.openURL(bleForgetDeviceUrl).catch(() => undefined);
        }}
        onRetry={state.retry}
      />
    );
  }

  const errorState = connectionErrorViewStates[state.error.type];

  return (
    <InfoState
      preset={errorState.preset}
      size="hug"
      title={t(errorState.title)}
      description={errorState.description ? t(errorState.description) : undefined}
      banner={errorState.banner ? { title: t(errorState.banner.title) } : undefined}
      primaryCta={errorState.primaryCta}
      secondaryCta={errorState.secondaryCta}
    />
  );
}
