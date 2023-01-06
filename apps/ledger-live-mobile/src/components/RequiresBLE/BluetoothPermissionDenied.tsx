import React, { useCallback, memo } from "react";
import { Button, IconBox, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import DeviceSetupView from "../DeviceSetupView";

const SafeAreaContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.colors.background.main};
  margin-left: ${p => `${p.theme.space[6]}px`};
  margin-right: ${p => `${p.theme.space[6]}px`};
`;

type Props = {
  neverAskAgain?: boolean;
};

const BluetoothPermissionDenied = ({ neverAskAgain }: Props) => {
  const { t } = useTranslation();
  const openNativeSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return (
    <DeviceSetupView hasBackButton>
      <SafeAreaContainer>
        <IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />
        <Text variant={"h2"} mb={5} mt={7} textAlign="center">
          {t("permissions.bluetooth.modalTitle")}
        </Text>
        <Text
          mb={10}
          variant={"body"}
          fontWeight={"medium"}
          textAlign="center"
          color={"neutral.c80"}
        >
          {neverAskAgain
            ? t("permissions.bluetooth.modalDescriptionSettingsVariant")
            : t("permissions.bluetooth.modalDescriptionBase")}
        </Text>
        <Button
          type="main"
          alignSelf="stretch"
          outline
          onPress={openNativeSettings}
        >
          {neverAskAgain
            ? t("permissions.bluetooth.modalButtonLabelSettingsVariant")
            : t("permissions.bluetooth.modalButtonLabelBase")}
        </Button>
      </SafeAreaContainer>
    </DeviceSetupView>
  );
};

export default memo(BluetoothPermissionDenied);
