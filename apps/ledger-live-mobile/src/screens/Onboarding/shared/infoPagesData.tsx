import React from "react";
import { Platform } from "react-native";
import { Trans } from "react-i18next";
import { AnimationSource, AnimationRecord } from "~/helpers/getDeviceAnimation";
import { resolveLottieAsset } from "~/utils/lottieAsset";

const pinCodeNanoXLight = resolveLottieAsset(require("../assets/nanoX/pinCode/light.lottie.json"));
const pinCodeNanoXDark = resolveLottieAsset(require("../assets/nanoX/pinCode/dark.lottie.json"));
const pinCodeNanoSLight = resolveLottieAsset(require("../assets/nanoS/pinCode/light.lottie.json"));
const pinCodeNanoSDark = resolveLottieAsset(require("../assets/nanoS/pinCode/dark.lottie.json"));
const pinCodeNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/pinCode/light.lottie.json"),
);
const pinCodeNanoSPDark = resolveLottieAsset(require("../assets/nanoSP/pinCode/dark.lottie.json"));
const recoverNanoXLight = resolveLottieAsset(require("../assets/nanoX/recover/light.lottie.json"));
const recoverNanoXDark = resolveLottieAsset(require("../assets/nanoX/recover/dark.lottie.json"));
const recoverNanoSLight = resolveLottieAsset(require("../assets/nanoS/recover/light.lottie.json"));
const recoverNanoSDark = resolveLottieAsset(require("../assets/nanoS/recover/dark.lottie.json"));
const recoverNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/recover/light.lottie.json"),
);
const recoverNanoSPDark = resolveLottieAsset(require("../assets/nanoSP/recover/dark.lottie.json"));
const confirmWordsNanoXLight = resolveLottieAsset(
  require("../assets/nanoX/confirmWords/light.lottie.json"),
);
const confirmWordsNanoXDark = resolveLottieAsset(
  require("../assets/nanoX/confirmWords/dark.lottie.json"),
);
const confirmWordsNanoSLight = resolveLottieAsset(
  require("../assets/nanoS/confirmWords/light.lottie.json"),
);
const confirmWordsNanoSDark = resolveLottieAsset(
  require("../assets/nanoS/confirmWords/dark.lottie.json"),
);
const confirmWordsNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/confirmWords/light.lottie.json"),
);
const confirmWordsNanoSPDark = resolveLottieAsset(
  require("../assets/nanoSP/confirmWords/dark.lottie.json"),
);
const numberOfWordsNanoXLight = resolveLottieAsset(
  require("../assets/nanoX/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoXDark = resolveLottieAsset(
  require("../assets/nanoX/numberOfWords/dark.lottie.json"),
);
const numberOfWordsNanoSLight = resolveLottieAsset(
  require("../assets/nanoS/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoSDark = resolveLottieAsset(
  require("../assets/nanoS/numberOfWords/dark.lottie.json"),
);
const numberOfWordsNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/numberOfWords/light.lottie.json"),
);
const numberOfWordsNanoSPDark = resolveLottieAsset(
  require("../assets/nanoSP/numberOfWords/dark.lottie.json"),
);
const powerOnNanoXLight = resolveLottieAsset(require("../assets/nanoX/powerOn/light.lottie.json"));
const powerOnNanoXDark = resolveLottieAsset(require("../assets/nanoX/powerOn/dark.lottie.json"));
const powerOnNanoSLight = resolveLottieAsset(require("../assets/nanoS/powerOn/light.lottie.json"));
const powerOnNanoSDark = resolveLottieAsset(require("../assets/nanoS/powerOn/dark.lottie.json"));
const powerOnNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/powerOn/light.lottie.json"),
);
const powerOnNanoSPDark = resolveLottieAsset(require("../assets/nanoSP/powerOn/dark.lottie.json"));
const powerOnRecoveryNanoXLight = resolveLottieAsset(
  require("../assets/nanoX/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoXDark = resolveLottieAsset(
  require("../assets/nanoX/powerOnRecovery/dark.lottie.json"),
);
const powerOnRecoveryNanoSLight = resolveLottieAsset(
  require("../assets/nanoS/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoSDark = resolveLottieAsset(
  require("../assets/nanoS/powerOnRecovery/dark.lottie.json"),
);
const powerOnRecoveryNanoSPLight = resolveLottieAsset(
  require("../assets/nanoSP/powerOnRecovery/light.lottie.json"),
);
const powerOnRecoveryNanoSPDark = resolveLottieAsset(
  require("../assets/nanoSP/powerOnRecovery/dark.lottie.json"),
);
import Check from "~/icons/Check";
import WarningOutline from "~/icons/WarningOutline";
import Close from "~/icons/Close";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import { urls } from "~/utils/urls";
import { DeviceModelId } from "@ledgerhq/types-devices";

type Keys =
  | "pinCode"
  | "recover"
  | "confirmWords"
  | "numberOfWords"
  | "powerOn"
  | "powerOnRecovery";

const animationKeys: Keys[] = [
  "pinCode",
  "recover",
  "confirmWords",
  "numberOfWords",
  "powerOn",
  "powerOnRecovery",
];

const deviceModelIdToAnimationKeys = {
  [DeviceModelId.nanoS]: animationKeys,
  [DeviceModelId.nanoSP]: animationKeys,
  [DeviceModelId.nanoX]: animationKeys,
  [DeviceModelId.blue]: [],
  [DeviceModelId.stax]: [],
  [DeviceModelId.europa]: [],
  [DeviceModelId.apex]: [],
} as const;

// Function implementation
export function getAnimationKeysForDeviceModelId<M extends DeviceModelId>(
  modelId: M,
): readonly DeviceModelIdToKeys[M][] {
  return deviceModelIdToAnimationKeys[modelId] as readonly DeviceModelIdToKeys[M][];
}

type DeviceModelIdToKeys = {
  [DeviceModelId.nanoS]: Keys;
  [DeviceModelId.nanoSP]: Keys;
  [DeviceModelId.nanoX]: Keys;
  [DeviceModelId.blue]: never;
  [DeviceModelId.stax]: never;
  [DeviceModelId.europa]: never;
  [DeviceModelId.apex]: never;
};

type AnimationsCollection = {
  [M in DeviceModelId]: Record<DeviceModelIdToKeys[M], AnimationRecord> & {
    style?: Record<string, unknown>;
  };
};

export const lottieAnimations: AnimationsCollection = {
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
    style: {
      width: "110%",
      left: "5%",
    },
  },
  blue: {},
  stax: {},
  europa: {},
  apex: {},
};

export type GetDeviceAnimationArgs<M extends DeviceModelId = DeviceModelId> = {
  theme?: "light" | "dark";
  modelId: M;
  key: DeviceModelIdToKeys[M];
};

// Return an animation associated to a device
export function getOnboardingDeviceAnimation<M extends DeviceModelId>({
  theme = "light",
  key,
  modelId,
}: GetDeviceAnimationArgs<M>): AnimationSource {
  const animation = lottieAnimations[modelId][key][theme];

  if (!animation) {
    console.error(`No animation for ${modelId} ${key}`);
    return "";
  }

  return animation;
}

const recoveryWarningInfoModalProps = [
  {
    Icon: WarningOutline,
    iconColor: "orange",
    title: <Trans i18nKey="onboarding.warning.recoveryPhrase.title" />,
    desc: <Trans i18nKey="onboarding.warning.recoveryPhrase.desc" />,
    link: {
      label: <Trans i18nKey="onboarding.warning.recoveryPhrase.supportLink" />,
      url: urls.supportPage,
    },
  },
];
const pinCodeInfoModalProps = [
  {
    title: <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.title" />,
    bullets: [
      {
        Icon: Check,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.0.label" />
        ),
        color: "success",
      },
      {
        Icon: Check,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.1.label" />
        ),
        color: "success",
      },
      {
        Icon: Check,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.2.label" />
        ),
        color: "success",
      },
      {
        Icon: Check,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.3.label" />
        ),
        color: "success",
      },
      {
        Icon: Check,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.4.label" />
        ),
        color: "success",
      },
      {
        Icon: Close,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.5.label" />
        ),
        color: "alert",
      },
      {
        Icon: Close,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.6.label" />
        ),
        color: "alert",
      },
      {
        Icon: Close,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.bullets.7.label" />
        ),
        color: "alert",
      },
    ],
  },
];
const recoveryPhraseInfoModalProps = [
  {
    title: <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title" />,
    desc: <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc" />,
  },
  {
    desc: <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc_1" />,
    link: {
      label: <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link" />,
      url: urls.recoveryPhraseInfo,
    },
  },
  {
    title: <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title_1" />,
    bullets: [
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.0.label" />
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.1.label" />
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.bullets.2.label" />
        ),
      },
    ],
  },
];
const hideRecoveryPhraseInfoModalProps = [
  {
    title: <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.title" />,
    bullets: [
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.0.label">
            {""}
            <LText bold>{""}</LText>
            {""}
          </Trans>
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.1.label">
            {""}
            <LText bold>{""}</LText>
            {""}
          </Trans>
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.2.label">
            {""}
            <LText bold>{""}</LText>
            {""}
          </Trans>
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.3.label">
            {""}
            <LText bold>{""}</LText>
            {""}
          </Trans>
        ),
      },
      {
        Icon: ArrowRight,
        label: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.bullets.4.label">
            {""}
            <LText bold>{""}</LText>
            {""}
          </Trans>
        ),
      },
    ],
  },
];
const pairNewErrorInfoModalProps = [
  {
    title: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.title" />,
    desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc" />,
  },
  {
    desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_1" />,
  },
  {
    desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_2" />,
  },
  ...(Platform.OS === "android"
    ? [
        {
          title: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.title_1" />,
          desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_3" />,
        },
        {
          desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_4" />,
          bullets: [
            {
              Icon: ArrowRight,
              label: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.0.label" />,
            },
            {
              Icon: ArrowRight,
              label: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.1.label" />,
            },
            {
              Icon: ArrowRight,
              label: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.2.label" />,
            },
            {
              Icon: ArrowRight,
              label: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.3.label" />,
            },
          ],
        },
        {
          desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_5" />,
        },
        {
          title: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.title_2" />,
          desc: <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_6" />,
        },
      ]
    : []),
];
export const infoModalScenes = {
  recoveryWarningInfoModalProps,
  pinCodeInfoModalProps,
  recoveryPhraseInfoModalProps,
  hideRecoveryPhraseInfoModalProps,
  pairNewErrorInfoModalProps,
};
