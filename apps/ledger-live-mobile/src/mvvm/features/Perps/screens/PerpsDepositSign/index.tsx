import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box, Button, Spinner } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import DeviceAction from "~/components/DeviceAction";
import GenericErrorView from "~/components/GenericErrorView";
import SelectDevice2 from "~/components/SelectDevice2";
import { useTranslation } from "~/context/Locale";
import type { PerpsDepositSignViewModel } from "./usePerpsDepositSignViewModel";

export function PerpsDepositSignView({
  selectedDevice,
  deviceStep,
  setSelectedDevice,
  retry,
  requestToSetHeaderOptions,
}: Readonly<PerpsDepositSignViewModel>) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      root: {
        flex: 1,
        backgroundColor: theme.colors.bg.base,
      },
    }),
    [],
  );

  if (!selectedDevice) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.root}>
        <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s8", flex: 1 }}>
          <SelectDevice2
            onSelect={setSelectedDevice}
            requestToSetHeaderOptions={requestToSetHeaderOptions}
            autoSelectLastConnectedDevice
          />
        </Box>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <Box lx={{ alignItems: "center", justifyContent: "center", padding: "s24", flex: 1 }}>
        {deviceStep.kind === "error" ? (
          <GenericErrorView
            error={deviceStep.error}
            footerComponent={
              <Button appearance="base" size="lg" onPress={retry} testID="perps-deposit-sign-retry">
                {t("common.retry")}
              </Button>
            }
          />
        ) : deviceStep.kind === "device" ? (
          deviceStep.withDeviceAction(({ action, request, onResult }) => (
            <DeviceAction
              key={deviceStep.stepId}
              action={action}
              device={selectedDevice}
              request={request}
              onResult={onResult}
              analyticsPropertyFlow="perps deposit"
            />
          ))
        ) : (
          // The off-device phases (provider payload, broadcast) have nothing to show.
          <Spinner />
        )}
        <SyncSkipUnderPriority priority={100} />
      </Box>
    </SafeAreaView>
  );
}
