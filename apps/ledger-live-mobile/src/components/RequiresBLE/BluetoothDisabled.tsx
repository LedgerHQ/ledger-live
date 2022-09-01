import React, { memo, useEffect } from "react";
import { Trans } from "react-i18next";
import { IconBox, Text } from "@ledgerhq/native-ui";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import { deviceNames } from "../../wording";
import { usePromptBluetoothCallback } from "../../logic/bluetoothHelper";

const SafeAreaContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.colors.background.main};
`;

function BluetoothDisabled() {
  const promptBluetooth = usePromptBluetoothCallback();

  useEffect(() => {
    // Prompts the user to enable bluetooth using native api calls when the component gets initially rendered.
    promptBluetooth().catch(() => {
      /* ignore */
    });
  }, [promptBluetooth]);

  return (
    <SafeAreaContainer>
      <IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />
      <Text variant={"h2"} mb={5} mt={7}>
        <Trans i18nKey="bluetooth.required" />
      </Text>
      <Text
        variant={"body"}
        fontWeight={"medium"}
        textAlign={"justify"}
        color={"neutral.c80"}
      >
        <Trans i18nKey="bluetooth.checkEnabled" values={deviceNames.nanoX} />
      </Text>
    </SafeAreaContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
export default memo<{}>(BluetoothDisabled);
