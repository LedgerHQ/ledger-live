import React from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { Flex } from "@ledgerhq/native-ui";

import { DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/components/Animation";

import pinCodeNanoXLight from "../../../assets/nanoX/pinCode/light.lottie";
import pinCodeNanoXDark from "../../../assets/nanoX/pinCode/dark.lottie";
import pinCodeNanoSLight from "../../../assets/nanoS/pinCode/light.lottie";
import pinCodeNanoSDark from "../../../assets/nanoS/pinCode/dark.lottie";
import pinCodeNanoSPLight from "../../../assets/nanoSP/pinCode/light.lottie";
import pinCodeNanoSPDark from "../../../assets/nanoSP/pinCode/dark.lottie";

import recoverNanoXLight from "../../../assets/nanoX/recover/light.lottie";
import recoverNanoXDark from "../../../assets/nanoX/recover/dark.lottie";
import recoverNanoSLight from "../../../assets/nanoS/recover/light.lottie";
import recoverNanoSDark from "../../../assets/nanoS/recover/dark.lottie";
import recoverNanoSPLight from "../../../assets/nanoSP/recover/light.lottie";
import recoverNanoSPDark from "../../../assets/nanoSP/recover/dark.lottie";

import confirmWordsNanoXLight from "../../../assets/nanoX/confirmWords/light.lottie";
import confirmWordsNanoXDark from "../../../assets/nanoX/confirmWords/dark.lottie";
import confirmWordsNanoSLight from "../../../assets/nanoS/confirmWords/light.lottie";
import confirmWordsNanoSDark from "../../../assets/nanoS/confirmWords/dark.lottie";
import confirmWordsNanoSPLight from "../../../assets/nanoSP/confirmWords/light.lottie";
import confirmWordsNanoSPDark from "../../../assets/nanoSP/confirmWords/dark.lottie";

import numberOfWordsNanoXLight from "../../../assets/nanoX/numberOfWords/light.lottie";
import numberOfWordsNanoXDark from "../../../assets/nanoX/numberOfWords/dark.lottie";
import numberOfWordsNanoSLight from "../../../assets/nanoS/numberOfWords/light.lottie";
import numberOfWordsNanoSDark from "../../../assets/nanoS/numberOfWords/dark.lottie";
import numberOfWordsNanoSPLight from "../../../assets/nanoSP/numberOfWords/light.lottie";
import numberOfWordsNanoSPDark from "../../../assets/nanoSP/numberOfWords/dark.lottie";

import powerOnNanoXLight from "../../../assets/nanoX/powerOn/light.lottie";
import powerOnNanoXDark from "../../../assets/nanoX/powerOn/dark.lottie";
import powerOnNanoSLight from "../../../assets/nanoS/powerOn/light.lottie";
import powerOnNanoSDark from "../../../assets/nanoS/powerOn/dark.lottie";
import powerOnNanoSPLight from "../../../assets/nanoSP/powerOn/light.lottie";
import powerOnNanoSPDark from "../../../assets/nanoSP/powerOn/dark.lottie";

import powerOnRecoveryNanoXLight from "../../../assets/nanoX/powerOnRecovery/light.lottie";
import powerOnRecoveryNanoXDark from "../../../assets/nanoX/powerOnRecovery/dark.lottie";
import powerOnRecoveryNanoSLight from "../../../assets/nanoS/powerOnRecovery/light.lottie";
import powerOnRecoveryNanoSDark from "../../../assets/nanoS/powerOnRecovery/dark.lottie";
import powerOnRecoveryNanoSPLight from "../../../assets/nanoSP/powerOnRecovery/light.lottie";
import powerOnRecoveryNanoSPDark from "../../../assets/nanoSP/powerOnRecovery/dark.lottie";

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
