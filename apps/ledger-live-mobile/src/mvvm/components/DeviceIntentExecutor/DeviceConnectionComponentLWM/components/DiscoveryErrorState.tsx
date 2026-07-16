import React from "react";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
  type DiscoveryError,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { InfoState } from "LLM/components/InfoState";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { useSourceFlow } from "../../utils/SourceFlowContext";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingSubError,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  setIsInTerminalConnectDeviceError,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.DiscoveryError }>;
  platform: Exclude<AppPlatform, "desktop">;
};

type InfoStateCta = React.ComponentProps<typeof InfoState>["primaryCta"];

type DiscoveryErrorViewState = {
  preset: "info" | "error";
  title: string;
  description?: string;
  primaryCta?: InfoStateCta;
  secondaryCta?: InfoStateCta;
};

type DiscoveryErrorType = DiscoveryError["type"];

type DiscoveryErrorViewStates = {
  [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]: { title: string };
} & Record<
  Exclude<DiscoveryErrorType, DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly>,
  DiscoveryErrorViewState
>;

const discoveryErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.discoveryError.errors";

function isTerminalDiscoveryError(error: DiscoveryError): boolean {
  return !error.resolution || error.resolution.type === "none";
}

export function DiscoveryErrorState({
  state,
  platform,
}: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const sourceFlow = useSourceFlow();
  const trackingTransport = getTrackingTransport(state.error.transportId);

  React.useEffect(() => {
    setIsInTerminalConnectDeviceError(isTerminalDiscoveryError(state.error));
    return () => setIsInTerminalConnectDeviceError(false);
  }, [state.error]);

  const trackingScreen = (
    <TrackScreen
      category={PAGE_CONNECT_DEVICE.DiscoveryError}
      sourceFlow={sourceFlow}
      {...(trackingTransport ? { transport: trackingTransport } : {})}
      subError={getTrackingSubError(state.error.type)}
      refreshSource
      deviceUxV2
    />
  );

  const retryCta = (labelKey: string, trackButtonName: string): InfoStateCta | undefined => {
    if (!state.retry) return undefined;
    const label = t(labelKey);
    return {
      label,
      onPress: () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: trackButtonName,
        });
        state.retry?.();
      },
    };
  };

  const ignoreCta = (labelKey: string): InfoStateCta => {
    const label = t(labelKey);
    return {
      label,
      onPress: () => {
        trackConnectDeviceButtonClicked({
          sourceFlow,
          button: CONNECT_DEVICE_BUTTON.ContinueWithUsb,
        });
        state.ignore();
      },
    };
  };

  const discoveryErrorViewStates: DiscoveryErrorViewStates = {
    [DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedPromptable.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedPromptable.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedPromptable.cta.retry`,
        CONNECT_DEVICE_BUTTON.AllowBluetooth,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedPromptable.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedManualSettings.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedManualSettings.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedManualSettings.cta.retry`,
        CONNECT_DEVICE_BUTTON.OpenSettings,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedManualSettings.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionUnauthorizedManualSettings.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothPermissionUnauthorizedManualSettings.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothPermissionUnauthorizedManualSettings.cta.platform.${platform}.retry`,
        CONNECT_DEVICE_BUTTON.OpenSettings,
      ),
      secondaryCta:
        platform === "android"
          ? ignoreCta(
              `${discoveryErrorTranslationBaseKey}.bluetoothPermissionUnauthorizedManualSettings.cta.platform.android.ignore`,
            )
          : undefined,
    },
    [DiscoveryErrorTypes.BluetoothDisabledPromptable]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothDisabledPromptable.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothDisabledPromptable.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothDisabledPromptable.cta.retry`,
        CONNECT_DEVICE_BUTTON.TurnOnBluetooth,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothDisabledPromptable.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.BluetoothDisabledManualAction]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothDisabledManualAction.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothDisabledManualAction.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.bluetoothDisabledManualAction.cta.platform.${platform}.retry`,
        CONNECT_DEVICE_BUTTON.OpenSettings,
      ),
      secondaryCta:
        platform === "android"
          ? ignoreCta(
              `${discoveryErrorTranslationBaseKey}.bluetoothDisabledManualAction.cta.platform.android.ignore`,
            )
          : undefined,
    },
    [DiscoveryErrorTypes.BluetoothUnsupported]: {
      preset: "error",
      title: `${discoveryErrorTranslationBaseKey}.bluetoothUnsupported.title`,
      description: `${discoveryErrorTranslationBaseKey}.bluetoothUnsupported.description.platform.${platform}`,
      primaryCta:
        platform === "android"
          ? ignoreCta(
              `${discoveryErrorTranslationBaseKey}.bluetoothUnsupported.cta.platform.android.ignore`,
            )
          : undefined,
    },
    [DiscoveryErrorTypes.LocationPermissionDeniedPromptable]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedPromptable.title`,
      description: `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedPromptable.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedPromptable.cta.retry`,
        CONNECT_DEVICE_BUTTON.AllowLocation,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedPromptable.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.LocationPermissionDeniedManualSettings]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedManualSettings.title`,
      description: `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedManualSettings.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedManualSettings.cta.retry`,
        CONNECT_DEVICE_BUTTON.OpenSettings,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedManualSettings.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.LocationDisabledPromptable]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.locationDisabledPromptable.title`,
      description: `${discoveryErrorTranslationBaseKey}.locationDisabledPromptable.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.locationDisabledPromptable.cta.retry`,
        CONNECT_DEVICE_BUTTON.TurnOnLocation,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.locationDisabledPromptable.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.LocationDisabledManualAction]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.locationDisabledManualAction.title`,
      description: `${discoveryErrorTranslationBaseKey}.locationDisabledManualAction.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.locationDisabledManualAction.cta.retry`,
        CONNECT_DEVICE_BUTTON.OpenSettings,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.locationDisabledManualAction.cta.ignore`,
      ),
    },
    [DiscoveryErrorTypes.LocationServicePermissionMissing]: {
      preset: "info",
      title: `${discoveryErrorTranslationBaseKey}.locationServicePermissionMissing.title`,
      description: `${discoveryErrorTranslationBaseKey}.locationServicePermissionMissing.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.locationServicePermissionMissing.cta.retry`,
        CONNECT_DEVICE_BUTTON.Retry,
      ),
      secondaryCta: ignoreCta(
        `${discoveryErrorTranslationBaseKey}.locationServicePermissionMissing.cta.ignore`,
      ),
    },
    [BaseDiscoveryErrorTypes.Unknown]: {
      preset: "error",
      title: `${discoveryErrorTranslationBaseKey}.unknown.title`,
      description: `${discoveryErrorTranslationBaseKey}.unknown.description`,
      primaryCta: retryCta(
        `${discoveryErrorTranslationBaseKey}.unknown.cta.retry`,
        CONNECT_DEVICE_BUTTON.Retry,
      ),
    },
    [DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly]: {
      title: `${discoveryErrorTranslationBaseKey}.bluetoothStateUnknownCheckOnly.title`,
    },
  };

  if (state.error.type === DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly) {
    const errorState = discoveryErrorViewStates[state.error.type];

    return (
      <Box lx={{ width: "full", alignItems: "center", paddingTop: "s16" }}>
        {trackingScreen}
        <Spinner size={32} color="base" />
        <Text
          typography="heading4SemiBold"
          lx={{ color: "base", textAlign: "center", paddingTop: "s16", paddingBottom: "s32" }}
        >
          {t(errorState.title)}
        </Text>
      </Box>
    );
  }

  const errorState = discoveryErrorViewStates[state.error.type];

  return (
    <>
      {trackingScreen}
      <InfoState
        preset={errorState.preset}
        size="hug"
        title={t(errorState.title)}
        description={errorState.description ? t(errorState.description) : undefined}
        primaryCta={errorState.primaryCta}
        secondaryCta={errorState.secondaryCta}
      />
    </>
  );
}
