import React from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { Flex } from "@ledgerhq/native-ui";

import { DeviceModelId } from "@ledgerhq/types-devices";
import Animation from "~/components/Animation";
import { resolveLottieAsset } from "~/utils/lottieAsset";

const pinCodeNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/pinCode/light.lottie.json"),
);
const pinCodeNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/pinCode/dark.lottie.json"),
);
const pinCodeNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/pinCode/light.lottie.json"),
);
const pinCodeNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/pinCode/dark.lottie.json"),
);
const pinCodeNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/pinCode/light.lottie.json"),
);
const pinCodeNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/pinCode/dark.lottie.json"),
);

const recoverNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/recover/light.lottie.json"),
);
const recoverNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/recover/dark.lottie.json"),
);
const recoverNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/recover/light.lottie.json"),
);
const recoverNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/recover/dark.lottie.json"),
);
const recoverNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/recover/light.lottie.json"),
);
const recoverNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/recover/dark.lottie.json"),
);

const confirmWordsNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/confirmWords/light.lottie.json"),
);
const confirmWordsNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/confirmWords/dark.lottie.json"),
);
const confirmWordsNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/confirmWords/light.lottie.json"),
);
const confirmWordsNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/confirmWords/dark.lottie.json"),
);
const confirmWordsNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/confirmWords/light.lottie.json"),
);
const confirmWordsNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/confirmWords/dark.lottie.json"),
);

const numberOfWordsNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/numberOfWords/dark.lottie.json"),
);
const numberOfWordsNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/numberOfWords/dark.lottie.json"),
);
const numberOfWordsNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/numberOfWords/dark.lottie.json"),
);

const powerOnNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/powerOn/light.lottie.json"),
);
const powerOnNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/powerOn/dark.lottie.json"),
);
const powerOnNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/powerOn/light.lottie.json"),
);
const powerOnNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/powerOn/dark.lottie.json"),
);
const powerOnNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/powerOn/light.lottie.json"),
);
const powerOnNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/powerOn/dark.lottie.json"),
);

const powerOnRecoveryNanoXLight = resolveLottieAsset(
  require("../../../assets/nanoX/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoXDark = resolveLottieAsset(
  require("../../../assets/nanoX/powerOnRecovery/dark.lottie.json"),
);
const powerOnRecoveryNanoSLight = resolveLottieAsset(
  require("../../../assets/nanoS/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoSDark = resolveLottieAsset(
  require("../../../assets/nanoS/powerOnRecovery/dark.lottie.json"),
);
const powerOnRecoveryNanoSPLight = resolveLottieAsset(
  require("../../../assets/nanoSP/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoSPDark = resolveLottieAsset(
  require("../../../assets/nanoSP/powerOnRecovery/dark.lottie.json"),
);

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
