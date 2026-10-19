import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { InfoState } from "@shared/ui-info-state";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import DeviceAction from "~/components/DeviceAction";
import { renderLoading } from "~/components/DeviceAction/rendering";
import SelectDevice2 from "~/components/SelectDevice2";
import TranslatedError from "~/components/TranslatedError";
import type { PerpsDepositDeviceStep } from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import { PerpsDepositConfirmation } from "./components/PerpsDepositConfirmation";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

type DepositStepProps = Readonly<{
  deviceStep: PerpsDepositDeviceStep;
  device: Device;
  onDeviceError: (error: Error) => void;
}>;

function DepositStep({ deviceStep, device, onDeviceError }: DepositStepProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const theme: "dark" | "light" = dark ? "dark" : "light";

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

function DepositError({ error, retry }: Readonly<{ error: Error; retry: () => void }>) {
  const { t } = useTranslation();

  return (
    <>
      <BottomSheetHeader />
      <InfoState
        preset="error"
        size="hug"
        title={<TranslatedError error={error} field="title" />}
        description={<TranslatedError error={error} field="description" />}
        primaryCta={{
          label: t("common.retry"),
          onPress: retry,
          testID: "perps-deposit-sign-retry",
        }}
        testID="perps-deposit-sign-error"
      />
    </>
  );
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
        ...StyleSheet.flatten(StyleSheet.absoluteFill),
        backgroundColor: theme.colors.bg.base,
        paddingHorizontal: 16,
        paddingTop: 8,
      },
    }),
    [],
  );
  const isError = deviceStep.kind === "error";

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
        preventBackdropClick={!isError}
        hideHandle={!isError}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 16 }}>
          {selectedDevice && deviceStep.kind === "error" ? (
            <DepositError error={deviceStep.error} retry={retry} />
          ) : (
            <Box lx={{ alignItems: "center" }} testID="perps-deposit-sign-step">
              {selectedDevice ? (
                <DepositStep
                  deviceStep={deviceStep}
                  device={selectedDevice}
                  onDeviceError={onDeviceError}
                />
              ) : null}
            </Box>
          )}
          {selectedDevice ? <SyncSkipUnderPriority priority={100} /> : null}
        </BottomSheetView>
      </QueuedBottomSheet>
    </>
  );
}
