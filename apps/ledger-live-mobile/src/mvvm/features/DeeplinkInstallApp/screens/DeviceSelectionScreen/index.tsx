import React from "react";
import { useTranslation } from "~/context/Locale";
import { Box, Text, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import SafeAreaView from "~/components/SafeAreaView";
import SelectDevice2 from "~/components/SelectDevice2";
import {
  useDeviceSelectionScreenViewModel,
  type DeviceSelectionScreenViewProps,
} from "./useDeviceSelectionScreenViewModel";

function DeviceSelectionScreenView({
  isFocused,
  appConfig,
  isHeaderOverridden,
  handleClose,
  onSelectDevice,
  requestToSetHeaderOptions,
}: DeviceSelectionScreenViewProps) {
  const { t } = useTranslation();

  if (!isFocused || !appConfig) return null;

  return (
    <SafeAreaView isFlex>
      {!isHeaderOverridden && (
        <Box lx={{ paddingHorizontal: "s16" }}>
          <Box
            lx={{
              flexDirection: "row",
              justifyContent: "flex-end",
              paddingTop: "s12",
              paddingBottom: "s16",
            }}
          >
            <IconButton
              icon={Close}
              appearance="gray"
              size="xs"
              onPress={handleClose}
              accessibilityLabel={t("common.close")}
            />
          </Box>
          <Text typography="heading4SemiBold" lx={{ color: "base", paddingBottom: "s32" }}>
            {t("deeplinkInstallApp.deviceSelection.title")}
          </Text>
        </Box>
      )}

      <Box lx={{ flex: 1 }}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={false}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          isChoiceDrawerDisplayedOnAddDevice={false}
        />
      </Box>
    </SafeAreaView>
  );
}

export function DeviceSelectionScreen() {
  const viewModel = useDeviceSelectionScreenViewModel();
  return <DeviceSelectionScreenView {...viewModel} />;
}
