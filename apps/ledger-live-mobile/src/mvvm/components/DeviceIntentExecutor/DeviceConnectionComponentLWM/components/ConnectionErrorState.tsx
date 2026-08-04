import React, { useEffect } from "react";
import { Linking } from "react-native";
import {
  BaseConnectionErrorTypes,
  ConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { InfoState } from "LLM/components/InfoState";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useTranslation } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { useDeviceIntentTracking } from "../../utils/DeviceIntentTrackingContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingSubError,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  setIsInTerminalConnectDeviceError,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";
import { PeerRemovedPairingState } from "./PeerRemovedPairingState";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.ConnectionError }>;
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

function isTerminalConnectionError(errorType: ConnectionErrorType): boolean {
  return errorType === BaseConnectionErrorTypes.Unknown;
}

const connectionErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.connectionError.errors";

export function ConnectionErrorState({
  state,
}: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const bleForgetDeviceUrl = useLocalizedUrl(urls.errors.BleForgetDevice);
  const pairingIssuesUrl = useLocalizedUrl(urls.pairingIssues);
  const productName = t("deviceIntentExecutor.connectDevice.common.ledgerDevice");

  useEffect(() => {
    setIsInTerminalConnectDeviceError(isTerminalConnectionError(state.error.type));
    return () => setIsInTerminalConnectDeviceError(false);
  }, [state.error]);

  const trackingScreen = (
    <TrackDIEScreen
      category={PAGE_CONNECT_DEVICE.ConnectionError}
      modelId={state.device.deviceModelId}
      transport={getTrackingTransport(state.device.transport)}
      subError={getTrackingSubError(state.error.type)}
      refreshSource
    />
  );

  const retryCta = (labelKey: string): InfoStateCta => {
    const label = t(labelKey);
    return {
      label,
      onPress: () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: CONNECT_DEVICE_BUTTON.Retry,
          extraProperties: analyticsProperties,
        });
        state.retry();
      },
    };
  };

  const helpCta = (labelKey: string, url: string): InfoStateCta => {
    const label = t(labelKey);
    return {
      label,
      onPress: () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: CONNECT_DEVICE_BUTTON.GetHelp,
          extraProperties: analyticsProperties,
        });
        Linking.openURL(url).catch(() => undefined);
      },
    };
  };

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
      <>
        {trackingScreen}
        <PeerRemovedPairingState
          title={t(errorState.title, { productName })}
          description={t(errorState.description, { productName })}
          helpLabel={helpLabel}
          retryLabel={retryLabel}
          onHelp={() => {
            trackConnectDeviceButtonClicked({
              sourceFlow,
              button: CONNECT_DEVICE_BUTTON.GetHelp,
              extraProperties: analyticsProperties,
            });
            Linking.openURL(bleForgetDeviceUrl).catch(() => undefined);
          }}
          onRetry={() => {
            trackConnectDeviceButtonClicked({
              sourceFlow,
              button: CONNECT_DEVICE_BUTTON.Retry,
              extraProperties: analyticsProperties,
            });
            state.retry();
          }}
        />
      </>
    );
  }

  const errorState = connectionErrorViewStates[state.error.type];

  return (
    <>
      {trackingScreen}
      <InfoState
        preset={errorState.preset}
        size="hug"
        title={t(errorState.title)}
        description={errorState.description ? t(errorState.description) : undefined}
        banner={errorState.banner ? { title: t(errorState.banner.title) } : undefined}
        primaryCta={errorState.primaryCta}
        secondaryCta={errorState.secondaryCta}
      />
    </>
  );
}
