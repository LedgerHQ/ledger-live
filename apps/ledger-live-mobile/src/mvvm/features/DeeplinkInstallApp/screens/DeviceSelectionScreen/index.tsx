import React from "react";
import { useTranslation } from "~/context/Locale";
import { Flex, Text, Icons } from "@ledgerhq/native-ui";
import { Pressable } from "react-native";
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
        <Flex px={16}>
          <Flex flexDirection="row" justifyContent="flex-end" pt={4} pb={6}>
            <Pressable
              onPress={handleClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
            >
              <Flex
                borderRadius={32}
                p={2}
                alignItems="center"
                justifyContent="center"
                backgroundColor="opacityDefault.c05"
              >
                <Icons.Close size="XS" />
              </Flex>
            </Pressable>
          </Flex>
          <Text fontWeight="semiBold" variant="h4" pb={8}>
            {t("deeplinkInstallApp.deviceSelection.title")}
          </Text>
        </Flex>
      )}

      <Flex flex={1}>
        <SelectDevice2
          onSelect={onSelectDevice}
          stopBleScanning={false}
          requestToSetHeaderOptions={requestToSetHeaderOptions}
          isChoiceDrawerDisplayedOnAddDevice={false}
        />
      </Flex>
    </SafeAreaView>
  );
}

export function DeviceSelectionScreen() {
  const viewModel = useDeviceSelectionScreenViewModel();
  return <DeviceSelectionScreenView {...viewModel} />;
}
