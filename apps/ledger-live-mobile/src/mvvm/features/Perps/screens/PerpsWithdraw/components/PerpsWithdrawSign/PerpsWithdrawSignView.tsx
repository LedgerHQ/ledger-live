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
import { PerpsDepositConfirmation } from "../../../PerpsDeposit/components/PerpsDepositSign/components/PerpsDepositConfirmation";
import type { PerpsWithdrawSignViewModel } from "./usePerpsWithdrawSignViewModel";

type WithdrawStepProps = Pick<
  PerpsWithdrawSignViewModel,
  "step" | "attempt" | "action" | "request" | "handleDeviceResult" | "handleDeviceError"
> &
  Readonly<{ device: Device }>;

function WithdrawStep({
  step,
  attempt,
  action,
  request,
  handleDeviceResult,
  handleDeviceError,
  device,
}: WithdrawStepProps) {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();

  if (step.kind === "sign") return <PerpsDepositConfirmation device={step.device} />;
  if (step.kind !== "connect") return renderLoading({ t, colors, theme: dark ? "dark" : "light" });

  return (
    <DeviceAction
      key={attempt}
      action={action}
      request={request}
      device={device}
      onResult={handleDeviceResult}
      onError={handleDeviceError}
      analyticsPropertyFlow="perps withdraw"
    />
  );
}

function WithdrawError({
  step,
  retry,
  onLeave,
}: Readonly<
  Pick<PerpsWithdrawSignViewModel, "retry" | "onLeave"> & {
    step: Extract<PerpsWithdrawSignViewModel["step"], { kind: "error" }>;
  }
>) {
  const { t } = useTranslation();

  return (
    <>
      <BottomSheetHeader />
      <InfoState
        preset="error"
        size="hug"
        title={<TranslatedError error={step.error} field="title" />}
        description={<TranslatedError error={step.error} field="description" />}
        primaryCta={
          step.canRetry
            ? { label: t("common.retry"), onPress: retry, testID: "perps-withdraw-sign-retry" }
            : { label: t("common.close"), onPress: onLeave, testID: "perps-withdraw-sign-close" }
        }
        testID="perps-withdraw-sign-error"
      />
    </>
  );
}

export function PerpsWithdrawSignView(viewModel: Readonly<PerpsWithdrawSignViewModel>) {
  const { selectedDevice, step, setSelectedDevice, handleDrawerClose, ignoreHeaderOptions } =
    viewModel;
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
  const isError = step.kind === "error";

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
          {selectedDevice && step.kind === "error" ? (
            <WithdrawError step={step} retry={viewModel.retry} onLeave={viewModel.onLeave} />
          ) : (
            <Box lx={{ alignItems: "center" }} testID="perps-withdraw-sign-step">
              {selectedDevice ? <WithdrawStep {...viewModel} device={selectedDevice} /> : null}
            </Box>
          )}
          {selectedDevice ? <SyncSkipUnderPriority priority={100} /> : null}
        </BottomSheetView>
      </QueuedBottomSheet>
    </>
  );
}
