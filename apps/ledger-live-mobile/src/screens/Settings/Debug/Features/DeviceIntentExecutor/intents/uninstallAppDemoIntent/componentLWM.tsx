import React from "react";
import { BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { Text, Flex, Button } from "@ledgerhq/native-ui";
import { OverrideDeviceIntentExecutorHeader } from "LLM/components/DeviceIntentExecutor";
import type { UninstallAppDemoIntentExtraProps, UninstallAppDemoIntentJobState } from "./types";

export function UninstallAppDemoIntentComponentLWM({
  jobState,
  extraProps,
}: {
  jobState: UninstallAppDemoIntentJobState | undefined;
  extraProps: UninstallAppDemoIntentExtraProps;
  onClose: () => void;
}) {
  return (
    <>
      <OverrideDeviceIntentExecutorHeader>
        <BottomSheetHeader title={`Uninstall ${extraProps.appName} intent`} density="compact" />
      </OverrideDeviceIntentExecutorHeader>
      <Flex p={4} alignItems="center">
        {jobState?.type === "promptUninstall" ? (
          <>
            <Text variant="subtitle" mb={2}>
              Uninstall {extraProps.appName}?
            </Text>
            <Flex flexDirection="row" columnGap={12}>
              <Button size="small" type="main" onPress={jobState.confirm}>
                Start
              </Button>
              <Button size="small" type="shade" onPress={jobState.skip}>
                Skip
              </Button>
            </Flex>
          </>
        ) : jobState?.type === "uninstalling" ? (
          <>
            <Text variant="h5" mb={4}>
              Uninstalling {extraProps.appName}…
            </Text>
            {jobState.userInteraction && (
              <Text variant="small" color="neutral.c70" mb={1}>
                User interaction: {jobState.userInteraction}
              </Text>
            )}
          </>
        ) : jobState?.type === "uninstallSuccess" ? (
          <Text variant="body" color="success.c60">
            {extraProps.appName} uninstalled successfully
          </Text>
        ) : jobState?.type === "uninstallFailed" ? (
          <Text variant="body" color="error.c60">
            Failed to uninstall {extraProps.appName}:{" "}
            {jobState.error instanceof Error ? jobState.error.message : String(jobState.error)}
          </Text>
        ) : null}
      </Flex>
    </>
  );
}
