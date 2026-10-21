import {
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@features/platform-device-intent";
import { DeviceIntentExecutor as BaseDeviceIntentExecutor } from "@features/platform-device-intent/react";
import { DeviceIntentExecutorHeaderContext } from "@ledgerhq/live-dmk-shared";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceDisconnected } from "./components/DeviceDisconnected";
import { IntentError } from "./components/IntentError";
import { InvalidOperation } from "./components/InvalidOperation";
import Connection from "./Connection";
import ContextInitializer, { InitializerConfig } from "./ContextInitializer";
import {
  DeviceIntentTrackingProvider,
  type DeviceIntentTrackingProperties,
  type SourceFlow,
} from "./utils/DeviceIntentTrackingContext";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorViewModel } from "./useDeviceIntentExecutorViewModel";

export {
  buildDeviceInitializationInput,
  type BuildDeviceInitializationInputParams,
} from "./ContextInitializer/utils/buildDeviceInitializationInput";
export type { InitializationInput } from "./types";
export type {
  DeviceIntentTrackingProperties,
  SourceFlow,
} from "./utils/DeviceIntentTrackingContext";

type Props<JobState, Input, ExtraProps, Result = undefined> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput,
  Result
> & {
  initializerConfig?: InitializerConfig;
  /**
   * Originating user intent that initiated the device flow. Required for analytics.
   */
  sourceFlow: SourceFlow;
  /**
   * Generic analytics bag merged into the deviceUxV2 funnel events emitted by this
   * flow.
   */
  analyticsProperties?: DeviceIntentTrackingProperties;
  /**
   * Sheet open request when it must differ from `enabled`. A caller that stays mounted
   * while the sheet closes sets this to false and unmounts from `onDeviceSheetDismissed`.
   */
  isRequestingToBeOpened?: boolean;
  /** Fires once the sheet has left the screen, including when it never opened. */
  onDeviceSheetDismissed?: () => void;
};

const platformConfig: ExecutorPlatformConfiguration<InitializationInput, InitializerConfig> = {
  DeviceConnectionComponent: Connection,
  DeviceContextInitializerComponent: ContextInitializer,
  DeviceDisconnectedComponent: DeviceDisconnected,
  IntentErrorComponent: IntentError,
  InvalidOperationComponent: InvalidOperation,
};

/**
 * LWM wrapper around `@features/platform-device-intent`'s `DeviceIntentExecutor`.
 */
export function DeviceIntentExecutor<JobState, Input, ExtraProps, Result = undefined>(
  props: Props<JobState, Input, ExtraProps, Result>,
): React.ReactElement {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;
  const { isRequestingToBeOpened, onDeviceSheetDismissed, ...executorProps } = props;
  const {
    wrappedProps,
    hasHeaderOverride,
    headerContextValue,
    trackingContextValue,
    onHeaderClosePressed,
    onBackdropPress,
  } = useDeviceIntentExecutorViewModel(executorProps);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened ?? wrappedProps.enabled}
      onClose={wrappedProps.onUserCancel}
      onModalHide={onDeviceSheetDismissed}
      onHeaderClosePressed={onHeaderClosePressed}
      onBackdropPress={onBackdropPress}
      hideHandle
      enableDynamicSizing
      maxDynamicContentSize={maxDynamicContentSize}
    >
      <DeviceIntentTrackingProvider value={trackingContextValue}>
        <DeviceIntentExecutorHeaderContext.Provider value={headerContextValue}>
          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
            showsVerticalScrollIndicator={false}
          >
            {!hasHeaderOverride && <BottomSheetHeader density="expanded" />}
            <BaseDeviceIntentExecutor
              {...wrappedProps}
              platformConfig={platformConfig}
              initializerConfig={wrappedProps.initializerConfig}
            />
          </BottomSheetScrollView>
        </DeviceIntentExecutorHeaderContext.Provider>
      </DeviceIntentTrackingProvider>
    </QueuedBottomSheet>
  );
}
