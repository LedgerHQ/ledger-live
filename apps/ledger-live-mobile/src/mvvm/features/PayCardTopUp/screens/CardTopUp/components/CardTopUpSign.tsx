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
import { useTranslation } from "@shared/i18n";
import DeviceAction from "~/components/DeviceAction";
import { renderError, renderLoading } from "~/components/DeviceAction/rendering";
import SelectDevice2, { type SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import type { RootStackParamList } from "~/components/RootNavigator/types/RootNavigator";
import type { CardTopUpSignViewModel } from "../useCardTopUpViewModel";

const ignoreHeaderOptions = (_request: SetHeaderOptionsRequest) => undefined;

type TopUpStepProps = Readonly<
  Pick<CardTopUpSignViewModel, "deviceStep" | "onRetry" | "onDeviceError"> & {
    device: Device;
  }
>;

function TopUpStep({ deviceStep, device, onRetry, onDeviceError }: TopUpStepProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme: "dark" | "light" = dark ? "dark" : "light";

  if (deviceStep.kind === "error") {
    return renderError({
      t,
      navigation,
      error: deviceStep.error,
      onRetry,
      colors,
      theme,
      device,
    });
  }

  if (deviceStep.kind !== "device") return renderLoading({ t, colors, theme });

  return deviceStep.withDeviceAction(({ action, request, onResult }) => (
    <DeviceAction
      key={deviceStep.stepId}
      action={action}
      request={request}
      device={device}
      onResult={onResult}
      onError={onDeviceError}
      analyticsPropertyFlow="pay card top up"
    />
  ));
}

export function CardTopUpSign({
  isOpen,
  device,
  deviceStep,
  onSelectDevice,
  onRetry,
  onDeviceError,
  onCancel,
}: CardTopUpSignViewModel) {
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

  if (!isOpen) return null;

  return (
    <>
      {device ? null : (
        <View style={styles.deviceSelection}>
          <SelectDevice2
            onSelect={onSelectDevice}
            requestToSetHeaderOptions={ignoreHeaderOptions}
            autoSelectLastConnectedDevice
          />
        </View>
      )}
      <QueuedBottomSheet
        isRequestingToBeOpened={!!device}
        onClose={onCancel}
        preventBackdropClick={deviceStep.kind !== "error"}
        hideHandle
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          <Box lx={{ alignItems: "center" }} testID="card-top-up-sign-step">
            {device ? (
              <TopUpStep
                deviceStep={deviceStep}
                device={device}
                onRetry={onRetry}
                onDeviceError={onDeviceError}
              />
            ) : null}
          </Box>
          {device ? <SyncSkipUnderPriority priority={100} /> : null}
        </BottomSheetView>
      </QueuedBottomSheet>
    </>
  );
}
