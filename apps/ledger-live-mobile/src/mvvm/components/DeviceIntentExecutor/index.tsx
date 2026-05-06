import {
  DeviceIntentExecutor,
  type DeviceIntentExecutorProps,
  type ExecutorPlatformConfiguration,
} from "@ledgerhq/device-intent";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
} from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeviceConnectionComponentLWM from "./DeviceConnectionComponentLWM";
import DeviceContextInitializerComponentLWM, {
  InitializerConfig,
} from "./DeviceContextInitializerComponentLWM";
import ErrorComponentLWM from "./ErrorComponentLWM";
import InvalidOperationComponentLWM from "./InvalidOperationComponentLWM";
import type { InitializationInput } from "./types";

type Props<JobState, Input, ExtraProps> = DeviceIntentExecutorProps<
  JobState,
  Input,
  ExtraProps,
  InitializationInput
> & {
  initializerConfig?: InitializerConfig;
};

const platformConfig: ExecutorPlatformConfiguration<InitializationInput, InitializerConfig> = {
  DeviceConnectionComponent: DeviceConnectionComponentLWM,
  DeviceContextInitializerComponent: DeviceContextInitializerComponentLWM,
  ConnectionErrorComponent: ErrorComponentLWM,
  IntentErrorComponent: ErrorComponentLWM,
  InvalidOperationComponent: InvalidOperationComponentLWM,
};

/**
 * NOTE: this is a work in progress. It does not yet follow mvvm architecture and has no tests,
 * the point for now it to allow manual testing of the DeviceIntentExecutor component.
 *
 * Initial implementation of the DeviceIntentExecutor for LWM.
 *
 * TODO (final version):
 * - Use Lumen UI components instead of hardcoded Native UI components
 * - MVVM architecture
 * - Tests
 */
export function DeviceIntentExecutorLWM<JobState, Input, ExtraProps>(
  props: Props<JobState, Input, ExtraProps>,
): React.ReactElement {
  const { bottom: bottomInset } = useSafeAreaInsets();
  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={props.enabled}
      onClose={props.onUserCancel}
      preventBackdropClick={!props.cancellableUI}
      enableDynamicSizing={false}
      snapPoints="medium"
    >
      <BottomSheetScrollView style={{ paddingBottom: bottomInset + 16 }}>
        {props.cancellableUI && <BottomSheetHeader density="expanded" />}
        <DeviceIntentExecutor
          {...props}
          platformConfig={platformConfig}
          initializerConfig={props.initializerConfig}
        />
      </BottomSheetScrollView>
    </QueuedDrawerBottomSheet>
  );
}
