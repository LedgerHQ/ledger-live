import React, { memo, useEffect } from "react";
import { NativeModules } from "react-native";
import { Trans } from "react-i18next";
import { IconBox, Text } from "@ledgerhq/native-ui";
import { BluetoothMedium } from "@ledgerhq/native-ui/assets/icons";
import styled from "styled-components/native";
import { deviceNames } from "../../wording";

const SafeAreaContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.colors.background.main};
  margin-left: ${p => `${p.theme.space[4]}px`};
  margin-right: ${p => `${p.theme.space[4]}px`};
`;

function BluetoothDisabled() {
  useEffect(() => {
    // Prompts the user to enable bluetooth using native api calls when the component gets initially rendered.
    NativeModules.BluetoothHelperModule.prompt().catch(() => {
      /* ignore */
    });
  }, []);

  return (
    <SafeAreaContainer>
      <IconBox Icon={BluetoothMedium} iconSize={24} boxSize={64} />
      <Text variant={"h2"} mb={5} mt={7} textAlign="center">
        <Trans i18nKey="bluetooth.required" />
      </Text>
      <Text
        variant={"body"}
        fontWeight={"medium"}
        textAlign="center"
        color={"neutral.c80"}
      >
        <Trans i18nKey="bluetooth.checkEnabled" values={deviceNames.nanoX} />
      </Text>
    </SafeAreaContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/ban-types
export default memo<{}>(BluetoothDisabled);
