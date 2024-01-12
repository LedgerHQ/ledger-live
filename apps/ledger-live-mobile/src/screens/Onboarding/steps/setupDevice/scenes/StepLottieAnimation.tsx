import React from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { Flex } from "@ledgerhq/native-ui";

import { DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/components/Animation";

import pinCodeNanoXLight from "../../../assets/nanoX/pinCode/light.json";
import pinCodeNanoXDark from "../../../assets/nanoX/pinCode/dark.json";
import pinCodeNanoSLight from "../../../assets/nanoS/pinCode/light.json";
import pinCodeNanoSDark from "../../../assets/nanoS/pinCode/dark.json";
import pinCodeNanoSPLight from "../../../assets/nanoSP/pinCode/light.json";
import pinCodeNanoSPDark from "../../../assets/nanoSP/pinCode/dark.json";

import recoverNanoXLight from "../../../assets/nanoX/recover/light.json";
import recoverNanoXDark from "../../../assets/nanoX/recover/dark.json";
import recoverNanoSLight from "../../../assets/nanoS/recover/light.json";
import recoverNanoSDark from "../../../assets/nanoS/recover/dark.json";
import recoverNanoSPLight from "../../../assets/nanoSP/recover/light.json";
import recoverNanoSPDark from "../../../assets/nanoSP/recover/dark.json";

import confirmWordsNanoXLight from "../../../assets/nanoX/confirmWords/light.json";
import confirmWordsNanoXDark from "../../../assets/nanoX/confirmWords/dark.json";
import confirmWordsNanoSLight from "../../../assets/nanoS/confirmWords/light.json";
import confirmWordsNanoSDark from "../../../assets/nanoS/confirmWords/dark.json";
import confirmWordsNanoSPLight from "../../../assets/nanoSP/confirmWords/light.json";
import confirmWordsNanoSPDark from "../../../assets/nanoSP/confirmWords/dark.json";

import numberOfWordsNanoXLight from "../../../assets/nanoX/numberOfWords/light.json";
import numberOfWordsNanoXDark from "../../../assets/nanoX/numberOfWords/dark.json";
import numberOfWordsNanoSLight from "../../../assets/nanoS/numberOfWords/light.json";
import numberOfWordsNanoSDark from "../../../assets/nanoS/numberOfWords/dark.json";
import numberOfWordsNanoSPLight from "../../../assets/nanoSP/numberOfWords/light.json";
import numberOfWordsNanoSPDark from "../../../assets/nanoSP/numberOfWords/dark.json";

import powerOnNanoXLight from "../../../assets/nanoX/powerOn/light.json";
import powerOnNanoXDark from "../../../assets/nanoX/powerOn/dark.json";
import powerOnNanoSLight from "../../../assets/nanoS/powerOn/light.json";
import powerOnNanoSDark from "../../../assets/nanoS/powerOn/dark.json";
import powerOnNanoSPLight from "../../../assets/nanoSP/powerOn/light.json";
import powerOnNanoSPDark from "../../../assets/nanoSP/powerOn/dark.json";

import powerOnRecoveryNanoXLight from "../../../assets/nanoX/powerOnRecovery/light.json";
import powerOnRecoveryNanoXDark from "../../../assets/nanoX/powerOnRecovery/dark.json";
import powerOnRecoveryNanoSLight from "../../../assets/nanoS/powerOnRecovery/light.json";
import powerOnRecoveryNanoSDark from "../../../assets/nanoS/powerOnRecovery/dark.json";
import powerOnRecoveryNanoSPLight from "../../../assets/nanoSP/powerOnRecovery/light.json";
import powerOnRecoveryNanoSPDark from "../../../assets/nanoSP/powerOnRecovery/dark.json";

const lottieAnimations = {
  nanoS: {
    pinCode: {
      light: pinCodeNanoSLight,
      dark: pinCodeNanoSDark,
    },
    recover: {
      light: recoverNanoSLight,
      dark: recoverNanoSDark,
    },
    confirmWords: {
      light: confirmWordsNanoSLight,
      dark: confirmWordsNanoSDark,
    },
    numberOfWords: {
      light: numberOfWordsNanoSLight,
      dark: numberOfWordsNanoSDark,
    },
    powerOn: {
      light: powerOnNanoSLight,
      dark: powerOnNanoSDark,
    },
    powerOnRecovery: {
      light: powerOnRecoveryNanoSLight,
      dark: powerOnRecoveryNanoSDark,
    },
    style: {},
  },
  nanoSP: {
    pinCode: {
      light: pinCodeNanoSPLight,
      dark: pinCodeNanoSPDark,
    },
    recover: {
      light: recoverNanoSPLight,
      dark: recoverNanoSPDark,
    },
    confirmWords: {
      light: confirmWordsNanoSPLight,
      dark: confirmWordsNanoSPDark,
    },
    numberOfWords: {
      light: numberOfWordsNanoSPLight,
      dark: numberOfWordsNanoSPDark,
    },
    powerOn: {
      light: powerOnNanoSPLight,
      dark: powerOnNanoSPDark,
    },
    powerOnRecovery: {
      light: powerOnRecoveryNanoSPLight,
      dark: powerOnRecoveryNanoSPDark,
    },
    style: {},
  },
  nanoX: {
    pinCode: {
      light: pinCodeNanoXLight,
      dark: pinCodeNanoXDark,
    },
    recover: {
      light: recoverNanoXLight,
      dark: recoverNanoXDark,
    },
    confirmWords: {
      light: confirmWordsNanoXLight,
      dark: confirmWordsNanoXDark,
    },
    numberOfWords: {
      light: numberOfWordsNanoXLight,
      dark: numberOfWordsNanoXDark,
    },
    powerOn: {
      light: powerOnNanoXLight,
      dark: powerOnNanoXDark,
    },
    powerOnRecovery: {
      light: powerOnRecoveryNanoXLight,
      dark: powerOnRecoveryNanoXDark,
    },
    style: { width: "110%", left: "5%" },
  },
  blue: {
    pinCode: {
      light: undefined,
      dark: undefined,
    },
    recover: {
      light: undefined,
      dark: undefined,
    },
    confirmWords: {
      light: undefined,
      dark: undefined,
    },
    numberOfWords: {
      light: undefined,
      dark: undefined,
    },
    powerOn: {
      light: undefined,
      dark: undefined,
    },
    powerOnRecovery: {
      light: undefined,
      dark: undefined,
    },
    style: {},
  },
};

export default function StepLottieAnimation({
  stepId,
  deviceModelId,
  theme,
  style,
}: {
  stepId: string;
  deviceModelId?: DeviceModelId;
  theme: "dark" | "light";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Flex alignItems="center" justifyContent="center" width="100%" height={150}>
      {
        // @ts-expect-error Indexing that way is not well supported by TS
        lottieAnimations?.[deviceModelId]?.[stepId]?.[theme] ? (
          <Animation
            // @ts-expect-error Indexing that way is not well supported by TS
            source={lottieAnimations[deviceModelId][stepId][theme]}
            style={[{ width: "110%" }, style]}
          />
        ) : null
      }
    </Flex>
  );
}
