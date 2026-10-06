import React from "react";
import { Linking } from "react-native";
import {
  BaseConnectionErrorTypes,
  ConnectionErrorTypes,
  type ConnectionError,
} from "@ledgerhq/live-dmk-mobile";
import type { ConnectionErrorUIState } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { PeerRemovedPairingState } from "./PeerRemovedPairingState";

type ConnectionErrorStateProps = {
  state: ConnectionErrorUIState<ConnectionError>;
  /** Called when the user presses a help CTA, before the help article opens. */
  onHelpPress?: () => void;
};
type ConnectionErrorType = ConnectionErrorStateProps["state"]["error"]["type"];

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
  [ConnectionErrorTypes.BlePairingPeerRemovedPairing]: BlePairingPeerRemovedPairingViewState;
} & Record<
  Exclude<ConnectionErrorType, ConnectionErrorTypes.BlePairingPeerRemovedPairing>,
  ConnectionErrorViewState
>;

const connectionErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.connectionError.errors";

export function ConnectionErrorState({
  state,
  onHelpPress,
}: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const bleForgetDeviceUrl = useLocalizedUrl(urls.errors.BleForgetDevice);
  const pairingIssuesUrl = useLocalizedUrl(urls.pairingIssues);
  const productName = t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  const openHelp = (url: string) => {
    onHelpPress?.();
    Linking.openURL(url).catch(() => undefined);
  };

  const retryCta = (labelKey: string): InfoStateCta => ({
    label: t(labelKey),
    onPress: () => state.retry(),
  });

  const helpCta = (labelKey: string, url: string): InfoStateCta => ({
    label: t(labelKey),
    onPress: () => openHelp(url),
  });

  const connectionErrorViewStates: ConnectionErrorViewStates = {
    [ConnectionErrorTypes.BlePairingRefused]: {
      preset: "info",
      title: `${connectionErrorTranslationBaseKey}.blePairingRefused.title`,
      primaryCta: retryCta(`${connectionErrorTranslationBaseKey}.blePairingRefused.cta.retry`),
    },
    [BaseConnectionErrorTypes.Unknown]: {
      preset: "error",
      title: `${connectionErrorTranslationBaseKey}.unknown.title`,
      description: `${connectionErrorTranslationBaseKey}.unknown.description`,
      banner: {
        title: `${connectionErrorTranslationBaseKey}.unknown.tip`,
      },
      primaryCta: retryCta(`${connectionErrorTranslationBaseKey}.unknown.cta.retry`),
      secondaryCta: helpCta(
        `${connectionErrorTranslationBaseKey}.unknown.cta.help`,
        pairingIssuesUrl,
      ),
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
    const helpLabel = t(errorState.helpLabel);
    const retryLabel = t(errorState.retryLabel);

    return (
      <PeerRemovedPairingState
        title={t(errorState.title, { productName })}
        description={t(errorState.description, { productName })}
        helpLabel={helpLabel}
        retryLabel={retryLabel}
        onHelp={() => openHelp(bleForgetDeviceUrl)}
        onRetry={() => state.retry()}
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
