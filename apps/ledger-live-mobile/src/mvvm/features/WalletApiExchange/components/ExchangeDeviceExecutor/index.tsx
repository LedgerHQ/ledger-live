import React from "react";
import { StyleSheet, View } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DeviceIntentExecutor } from "LLM/components/DeviceIntentExecutor";
import { ShowExchangeErrorIntentComponent } from "../../deviceIntents/showExchangeErrorIntent/component";
import type { ExchangeSession } from "../../session";
import { useExchangeDeviceExecutorViewModel } from "./useExchangeDeviceExecutorViewModel";

type Props = Readonly<{
  session: ExchangeSession;
}>;

const deviceConnectionParams = { acceptedDeviceModelIds: [] };

/**
 * The Device Intent Executor of one exchange session. It stays mounted for every step of the
 * session: the session swaps the intent, without connecting the device again.
 */
export function ExchangeDeviceExecutor({ session }: Props) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    sourceFlow,
    analyticsProperties,
    deviceInitializationInput,
    intent,
    disconnectedErrorState,
    onExecutorStateChanged,
    onIntentJobComplete,
    onIntentJobError,
    onUserCancel,
  } = useExchangeDeviceExecutorViewModel({ session });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      testID="wallet-api-exchange-step"
    >
      {disconnectedErrorState ? (
        <QueuedBottomSheet
          isRequestingToBeOpened
          onClose={onUserCancel}
          hideHandle
          enableDynamicSizing
        >
          <BottomSheetScrollView
            contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
            showsVerticalScrollIndicator={false}
          >
            <BottomSheetHeader density="expanded" />
            <ShowExchangeErrorIntentComponent
              jobState={disconnectedErrorState}
              extraProps={undefined}
              onClose={onUserCancel}
            />
          </BottomSheetScrollView>
        </QueuedBottomSheet>
      ) : (
        <DeviceIntentExecutor
          enabled
          sourceFlow={sourceFlow}
          analyticsProperties={analyticsProperties}
          deviceConnectionParams={deviceConnectionParams}
          deviceInitializationInput={deviceInitializationInput}
          intent={intent}
          intentComponentExtraProps={undefined}
          onExecutorStateChanged={onExecutorStateChanged}
          onIntentJobComplete={onIntentJobComplete}
          onIntentJobError={onIntentJobError}
          cancelIntentRequestId={undefined}
          onUserCancel={onUserCancel}
        />
      )}
    </View>
  );
}
