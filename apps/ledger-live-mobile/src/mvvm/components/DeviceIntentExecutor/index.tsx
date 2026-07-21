import {
  DeviceIntentExecutor,
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@ledgerhq/device-intent";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceDisconnected } from "./components/DeviceDisconnected";
import { IntentError } from "./components/IntentError";
import { InvalidOperation } from "./components/InvalidOperation";
import { OverrideDeviceIntentExecutorHeader } from "./components/OverrideDeviceIntentExecutorHeader";
import DeviceConnectionComponentLWM from "./DeviceConnectionComponentLWM";
import DeviceContextInitializerComponentLWM, {
  InitializerConfig,
} from "./DeviceContextInitializerComponentLWM";
import { SourceFlowProvider, type SourceFlow } from "./utils/SourceFlowContext";
import { DeviceIntentExecutorHeaderContext } from "./utils/DeviceIntentExecutorHeaderContext";
import type { InitializationInput } from "./types";
import { useDeviceIntentExecutorLWMViewModel } from "./useDeviceIntentExecutorLWMViewModel";

export {
  buildDeviceInitializationInput,
  type BuildDeviceInitializationInputParams,
} from "./DeviceContextInitializerComponentLWM/utils/buildDeviceInitializationInput";
export type { InitializationInput } from "./types";
export type { SourceFlow } from "./utils/SourceFlowContext";
export { OverrideDeviceIntentExecutorHeader };

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
  /**
   * Originating user intent that initiated the device flow. Required for analytics.
   */
  sourceFlow: SourceFlow;
};

const platformConfig: ExecutorPlatformConfiguration<InitializationInput, InitializerConfig> = {
  DeviceConnectionComponent: DeviceConnectionComponentLWM,
  DeviceContextInitializerComponent: DeviceContextInitializerComponentLWM,
  DeviceDisconnectedComponent: DeviceDisconnected,
  IntentErrorComponent: IntentError,
  InvalidOperationComponent: InvalidOperation,
};

/**
 * LWM wrapper around `@ledgerhq/device-intent`'s `DeviceIntentExecutor`.
 */
export function DeviceIntentExecutorLWM<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): React.ReactElement {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  // Lumen's static preset can force Android dynamic sheets full height, so use the live window cap.
  const maxDynamicContentSize = Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset;
  const {
    sourceFlow,
    wrappedProps,
    hasHeaderOverride,
    headerContextValue,
    onHeaderClosePressed,
    onBackdropPress,
  } = useDeviceIntentExecutorLWMViewModel(props);

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={wrappedProps.enabled}
      onClose={wrappedProps.onUserCancel}
      onHeaderClosePressed={onHeaderClosePressed}
      onBackdropPress={onBackdropPress}
      hideHandle
      enableDynamicSizing
      maxDynamicContentSize={maxDynamicContentSize}
    >
      <SourceFlowProvider value={sourceFlow}>
        <DeviceIntentExecutorHeaderContext.Provider value={headerContextValue}>
          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
            showsVerticalScrollIndicator={false}
          >
            {!hasHeaderOverride && <BottomSheetHeader density="expanded" />}
            <DeviceIntentExecutor
              {...wrappedProps}
              platformConfig={platformConfig}
              initializerConfig={wrappedProps.initializerConfig}
            />
          </BottomSheetScrollView>
        </DeviceIntentExecutorHeaderContext.Provider>
      </SourceFlowProvider>
    </QueuedDrawerBottomSheet>
  );
}
