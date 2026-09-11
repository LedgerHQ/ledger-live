import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import DeviceAction from "~/components/DeviceAction";
import { renderError, renderLoading } from "~/components/DeviceAction/rendering";
import SelectDevice2 from "~/components/SelectDevice2";
import type { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import type { PerpsDepositDeviceStep } from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import { PerpsDepositConfirmation } from "./components/PerpsDepositConfirmation";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type DepositStepProps = Readonly<{
  deviceStep: PerpsDepositDeviceStep;
  device: Device;
  retry: () => void;
  onDeviceError: (error: Error) => void;
}>;

function DepositStep({ deviceStep, device, retry, onDeviceError }: DepositStepProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme: "dark" | "light" = dark ? "dark" : "light";

  if (deviceStep.kind === "error")
    return renderError({
      t,
      navigation,
      error: deviceStep.error,
      onRetry: retry,
      colors,
      theme,
      device,
    });

  if (deviceStep.kind !== "device") return renderLoading({ t, colors, theme });

  return deviceStep.withDeviceAction(({ action, request, onResult }) => (
    <DeviceAction
      key={deviceStep.stepId}
      action={action}
      request={request}
      device={device}
      onResult={onResult}
      onError={onDeviceError}
      analyticsPropertyFlow="perps deposit"
      renderExchangeConfirmation={
        deviceStep.stepId === "confirm"
          ? () => <PerpsDepositConfirmation device={device} />
          : undefined
      }
    />
  ));
}

export function PerpsDepositSignView({
  selectedDevice,
  deviceStep,
  setSelectedDevice,
  retry,
  onDeviceError,
  handleDrawerClose,
  ignoreHeaderOptions,
}: Readonly<PerpsDepositSignViewModel>) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useStyleSheet(
    theme => ({
      deviceSelection: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.bg.base,
        paddingHorizontal: 16,
        paddingTop: 8,
      },
    }),
    [],
  );

  return (
    <>
      {selectedDevice ? null : (
        <View style={styles.deviceSelection}>
          <SelectDevice2
            onSelect={setSelectedDevice}
            requestToSetHeaderOptions={ignoreHeaderOptions}
            autoSelectLastConnectedDevice
          />
        </View>
      )}
      <QueuedBottomSheet
        isRequestingToBeOpened={!!selectedDevice}
        onClose={handleDrawerClose}
        preventBackdropClick={deviceStep.kind !== "error"}
        hideHandle
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          <Box lx={{ alignItems: "center" }} testID="perps-deposit-sign-step">
            {selectedDevice ? (
              <DepositStep
                deviceStep={deviceStep}
                device={selectedDevice}
                retry={retry}
                onDeviceError={onDeviceError}
              />
            ) : null}
          </Box>
          {selectedDevice ? <SyncSkipUnderPriority priority={100} /> : null}
        </BottomSheetView>
      </QueuedBottomSheet>
    </>
  );
}
