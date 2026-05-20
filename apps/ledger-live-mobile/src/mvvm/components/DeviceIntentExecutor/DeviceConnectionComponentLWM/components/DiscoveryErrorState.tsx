import React from "react";
import {
  ConnectDeviceUIStateTypes,
  DiscoveryErrorTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { AppPlatform } from "@ledgerhq/live-common/platform/types";
import { InfoState } from "LLM/components/InfoState";
import { useTranslation } from "~/context/Locale";
import { Box, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
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

const discoveryErrorTranslationBaseKey =
  "deviceIntentExecutor.connectDevice.states.discoveryError.errors";

function assertNever(value: never): never {
  throw new Error(`Unhandled discovery error type: ${JSON.stringify(value)}`);
}

export function DiscoveryErrorState({
  state,
  platform,
}: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();

  if (state.error.type === DiscoveryErrorTypes.BluetoothStateUnknownCheckOnly) {
    const key = `${discoveryErrorTranslationBaseKey}.bluetoothStateUnknownCheckOnly`;

    return (
      <Box lx={{ width: "full", alignItems: "center", paddingTop: "s16" }}>
      <Spinner size={32} color="base" />
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", textAlign: "center", paddingTop: "s16", paddingBottom: "s32" }}
      >
        {t(`${key}.title`)}
      </Text>
    </Box>
    );
  }

  const retryCta = (labelKey: string): InfoStateCta | undefined =>
    state.retry
      ? {
          label: t(labelKey),
          onPress: state.retry,
        }
      : undefined;

  const ignoreCta = (labelKey: string): InfoStateCta => ({
    label: t(labelKey),
    onPress: state.ignore,
  });

  const errorState: DiscoveryErrorViewState = (() => {
    switch (state.error.type) {
      case DiscoveryErrorTypes.BluetoothPermissionDeniedPromptable: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedPromptable`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.BluetoothPermissionDeniedManualSettings: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothPermissionDeniedManualSettings`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.BluetoothPermissionUnauthorizedManualSettings: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothPermissionUnauthorizedManualSettings`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.platform.${platform}.retry`),
          secondaryCta:
            platform === "android" ? ignoreCta(`${key}.cta.platform.android.ignore`) : undefined,
        };
      }

      case DiscoveryErrorTypes.BluetoothDisabledPromptable: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothDisabledPromptable`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.BluetoothDisabledManualAction: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothDisabledManualAction`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.platform.${platform}.retry`),
          secondaryCta:
            platform === "android" ? ignoreCta(`${key}.cta.platform.android.ignore`) : undefined,
        };
      }

      case DiscoveryErrorTypes.BluetoothUnsupported: {
        const key = `${discoveryErrorTranslationBaseKey}.bluetoothUnsupported`;
        return {
          preset: "error",
          title: t(`${key}.title`),
          description: t(`${key}.description.platform.${platform}`),
          primaryCta:
            platform === "android" ? ignoreCta(`${key}.cta.platform.android.ignore`) : undefined,
        };
      }

      case DiscoveryErrorTypes.LocationPermissionDeniedPromptable: {
        const key = `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedPromptable`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.LocationPermissionDeniedManualSettings: {
        const key = `${discoveryErrorTranslationBaseKey}.locationPermissionDeniedManualSettings`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.LocationDisabledPromptable: {
        const key = `${discoveryErrorTranslationBaseKey}.locationDisabledPromptable`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.LocationDisabledManualAction: {
        const key = `${discoveryErrorTranslationBaseKey}.locationDisabledManualAction`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.LocationServicePermissionMissing: {
        const key = `${discoveryErrorTranslationBaseKey}.locationServicePermissionMissing`;
        return {
          preset: "info",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
          secondaryCta: ignoreCta(`${key}.cta.ignore`),
        };
      }

      case DiscoveryErrorTypes.Unknown: {
        const key = `${discoveryErrorTranslationBaseKey}.unknown`;
        return {
          preset: "error",
          title: t(`${key}.title`),
          description: t(`${key}.description`),
          primaryCta: retryCta(`${key}.cta.retry`),
        };
      }

      default:
        return assertNever(state.error);
    }
  })();

  return (
    <InfoState
      preset={errorState.preset}
      size="hug"
      title={errorState.title}
      description={errorState.description}
      primaryCta={errorState.primaryCta}
      secondaryCta={errorState.secondaryCta}
    />
  );
}
