// @flow
import React from "react";
import { Platform } from "react-native";
import { Trans } from "react-i18next";
import type { OnboardingScene } from "../../../components/OnboardingStepperView";

import setupDeviceStartImage from "../assets/getStarted.png";
import pinCodeImage from "../assets/pinCodeImage.png";

import recoveryPhrase from "../assets/recoveryPhrase.png";
import recoverySheet from "../assets/recoverySheet.png";
import hideRecoveryPhrase from "../assets/hideRecoveryPhrase.png";

import pinCodeNanoX from "../assets/nanoX/pinCode/data.json";
import pinCodeNanoS from "../assets/nanoS/pinCode/data.json";

import recoverNanoX from "../assets/nanoX/recover/data.json";
import recoverNanoS from "../assets/nanoS/recover/data.json";

import confirmWordsNanoX from "../assets/nanoX/confirmWords/data.json";
import confirmWordsNanoS from "../assets/nanoS/confirmWords/data.json";

import numberOfWordsNanoX from "../assets/nanoX/numberOfWords/data.json";
import numberOfWordsNanoS from "../assets/nanoS/numberOfWords/data.json";

import powerOnNanoX from "../assets/nanoX/powerOn/data.json";
import powerOnNanoS from "../assets/nanoS/powerOn/data.json";

import powerOnRecoveryNanoX from "../assets/nanoX/powerOnRecovery/data.json";
import powerOnRecoveryNanoS from "../assets/nanoS/powerOnRecovery/data.json";

import importRecoveryPhrase from "../assets/importRecoveryPhrase.png";
import syncCryptos from "../assets/syncCryptos.png";

import onboardingQuizImage from "../assets/onboardingQuiz.png";

import Clock from "../../../icons/Clock";
import Edit from "../../../icons/Edit";
import Check from "../../../icons/Check";
import Warning from "../../../icons/Warning";
import EyeCrossed from "../../../icons/EyeCrossed";
import Close from "../../../icons/Close";
import Flower from "../../../icons/Flower";
import ArrowRight from "../../../icons/ArrowRight";
import LText from "../../../components/LText";
import NanoDeviceCancelIcon from "../../../icons/NanoDeviceCancelIcon";
import NanoDeviceCheckIcon from "../../../icons/NanoDeviceCheckIcon";

import { urls } from "../../../config/urls";

const lottieAnimations = {
  nanoS: {
    pinCode: pinCodeNanoS,
    recover: recoverNanoS,
    confirmWords: confirmWordsNanoS,
    numberOfWords: numberOfWordsNanoS,
    powerOn: powerOnNanoS,
    powerOnRecovery: powerOnRecoveryNanoS,
    style: {},
  },
  nanoX: {
    pinCode: pinCodeNanoX,
    recover: recoverNanoX,
    confirmWords: confirmWordsNanoX,
    numberOfWords: numberOfWordsNanoX,
    powerOn: powerOnNanoX,
    powerOnRecovery: powerOnRecoveryNanoX,
    style: { width: "110%", left: "5%" },
  },
  blue: {
    pinCode: undefined,
    recover: undefined,
    confirmWords: undefined,
    numberOfWords: undefined,
    powerOn: undefined,
    powerOnRecovery: undefined,
    style: {},
  },
};

const pinCodeInfoModalProps = [
  {
    title: (
      <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.infoModal.title" />
    ),
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
    title: (
      <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title" />
    ),
    desc: (
      <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc" />
    ),
  },
  {
    desc: (
      <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.desc_1" />
    ),
    link: {
      label: (
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link" />
      ),
      url: urls.recoveryPhraseInfo,
    },
  },
  {
    title: (
      <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.title_1" />
    ),
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
    title: (
      <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.infoModal.title" />
    ),
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
          title: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.title_1" />
          ),
          desc: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_3" />
          ),
        },
        {
          desc: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_4" />
          ),
          bullets: [
            {
              Icon: ArrowRight,
              label: (
                <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.0.label" />
              ),
            },
            {
              Icon: ArrowRight,
              label: (
                <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.1.label" />
              ),
            },
            {
              Icon: ArrowRight,
              label: (
                <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.2.label" />
              ),
            },
            {
              Icon: ArrowRight,
              label: (
                <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.bullets.3.label" />
              ),
            },
          ],
        },
        {
          desc: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_5" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.title_2" />
          ),
          desc: (
            <Trans i18nKey="onboarding.stepPairNew.errorInfoModal.desc_6" />
          ),
        },
      ]
    : []),
];

export const infoModalScenes = {
  pinCodeInfoModalProps,
  recoveryPhraseInfoModalProps,
  hideRecoveryPhraseInfoModalProps,
  pairNewErrorInfoModalProps,
};

const pinCodeScenes = deviceModelId => [
  {
    sceneProps: {
      trackPage: "Pin code step 1",
      image: pinCodeImage,
      title: <Trans i18nKey="onboarding.stepSetupDevice.pinCode.title" />,
      descs: [<Trans i18nKey="onboarding.stepSetupDevice.pinCode.desc" />],
      ctaText: <Trans i18nKey="onboarding.stepSetupDevice.pinCode.cta" />,
      ctaWarningCheckbox: {
        desc: (
          <Trans i18nKey="onboarding.stepSetupDevice.pinCode.checkboxDesc" />
        ),
      },
    },
    sceneInfoKey: "pinCodeInfoModalProps",
    type: "primary",
    id: "pinCode",
  },
  {
    sceneProps: {
      trackPage: "Pin code step 2",
      lottie: lottieAnimations[deviceModelId].pinCode,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.bullets.0.title" />
          ),
          label: (
            <>
              <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.bullets.0.label">
                {""}
                <NanoDeviceCheckIcon size={12} />
                <NanoDeviceCancelIcon size={12} />
                {""}
              </Trans>
            </>
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.bullets.1.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.bullets.1.label" />
          ),
        },
      ],
      ctaText: <Trans i18nKey="onboarding.stepSetupDevice.pinCodeSetup.cta" />,
    },
    sceneInfoKey: "pinCodeInfoModalProps",
    type: "secondary",
    id: "pinCodeSetup",
  },
];

const getSetupDeviceScenes: (
  deviceModelId: "nanoS" | "nanoX" | "blue",
) => OnboardingScene[] = deviceModelId => [
  {
    sceneProps: {
      trackPage: "Get started step 1",
      image: setupDeviceStartImage,
      title: <Trans i18nKey="onboarding.stepSetupDevice.start.title" />,
      bullets: [
        {
          Icon: Clock,
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.start.bullets.0.label" />
          ),
        },
        {
          Icon: Edit,
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.start.bullets.1.label" />
          ),
        },
        {
          Icon: Flower,
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.start.bullets.2.label" />
          ),
        },
      ],
      ctaText: <Trans i18nKey="onboarding.stepSetupDevice.start.cta" />,
      ctaWarningModal: {
        Icon: Warning,
        title: (
          <Trans i18nKey="onboarding.stepSetupDevice.start.warning.title" />
        ),
        desc: <Trans i18nKey="onboarding.stepSetupDevice.start.warning.desc" />,
        ctaText: (
          <Trans i18nKey="onboarding.stepSetupDevice.start.warning.ctaText" />
        ),
      },
    },
    type: "primary",
    id: "start",
  },
  {
    sceneProps: {
      trackPage: "Get started step 2",
      lottie: lottieAnimations[deviceModelId].powerOn,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.0.title" />
          ),
          label: (
            <Trans
              i18nKey={`onboarding.stepSetupDevice.setup.bullets.0.${deviceModelId}.label`}
            />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.1.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.1.label" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.2.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.2.label" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.3.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.setup.bullets.3.label" />
          ),
        },
      ],
      ctaText: <Trans i18nKey="onboarding.stepSetupDevice.setup.cta" />,
    },
    type: "secondary",
    id: "setup",
  },
  ...pinCodeScenes(deviceModelId),
  {
    sceneProps: {
      trackPage: "Recovery step 1",
      image: recoveryPhrase,
      title: (
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhrase.title" />
      ),
      descs: [
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhrase.desc" />,
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhrase.cta" />
      ),
      ctaWarningCheckbox: {
        desc: (
          <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhrase.checkboxDesc" />
        ),
      },
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "primary",
    id: "recoveryPhrase",
  },
  {
    sceneProps: {
      trackPage: "Recovery step 2",
      image: recoverySheet,
      bullets: [
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.0.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.0.label" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.1.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.1.label" />
          ),
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.cta" />
      ),
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "secondary",
    id: "recoveryPhraseSetup",
  },
  {
    sceneProps: {
      trackPage: "Recovery step 3",
      lottie: lottieAnimations[deviceModelId].recover,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          index: 3,
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.2.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.2.label" />
          ),
        },
        {
          index: 4,
          title: (
            <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.bullets.3.title" />
          ),
          label: "",
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepSetupDevice.recoveryPhraseSetup.nextStep" />
      ),
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "secondary",
    id: "recoveryPhraseSetup_1",
  },
  {
    sceneProps: {
      trackPage: "Recovery step 4",
      image: hideRecoveryPhrase,
      title: (
        <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.title" />
      ),
      descs: [
        <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.desc" />,
      ],
      bullets: [
        {
          Icon: Warning,
          color: "alert",
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.bullets.0.label" />
          ),
        },
        {
          Icon: EyeCrossed,
          color: "alert",
          label: (
            <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.bullets.1.label" />
          ),
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.cta" />
      ),
      ctaWarningModal: {
        image: onboardingQuizImage,
        title: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.warning.title" />
        ),
        desc: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.warning.desc" />
        ),
        ctaText: (
          <Trans i18nKey="onboarding.stepSetupDevice.hideRecoveryPhrase.warning.cta" />
        ),
      },
    },
    sceneInfoKey: "hideRecoveryPhraseInfoModalProps",
    type: "primary",
    id: "hideRecoveryPhrase",
  },
];

const getRecoveryPhraseScenes = (deviceModelId: string) => [
  {
    sceneProps: {
      trackPage: "RecoveryPhrase step 1",
      image: importRecoveryPhrase,
      title: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.title" />
      ),
      descs: [
        <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.desc" />,
        <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.desc_1" />,
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.cta" />
      ),
      ctaWarningModal: {
        Icon: Warning,
        title: (
          <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.title" />
        ),
        desc: (
          <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.desc" />
        ),
        ctaText: (
          <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.cta" />
        ),
      },
    },
    type: "primary",
    id: "importRecoveryPhrase",
  },
  {
    sceneProps: {
      trackPage: "RecoveryPhrase step 2",
      lottie: lottieAnimations[deviceModelId].powerOnRecovery,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.0.title" />
          ),
          label: (
            <Trans
              i18nKey={`onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.0.${deviceModelId}.label`}
            />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.1.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.1.label" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.2.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.2.label" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.3.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.bullets.3.label" />
          ),
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.importRecoveryPhrase.nextStep" />
      ),
    },
    type: "secondary",
    id: "importRecoveryPhrase_1",
  },
  ...pinCodeScenes(deviceModelId),
  {
    sceneProps: {
      trackPage: "RecoveryPhrase step 3",
      image: importRecoveryPhrase,
      title: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.title" />
      ),
      descs: [
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.paragraph1" />,
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.paragraph2" />,
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep" />
      ),
      ctaWarningCheckbox: {
        desc: (
          <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.checkboxDesc" />
        ),
      },
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "primary",
    id: "existingRecoveryPhrase",
  },
  {
    sceneProps: {
      trackPage: "RecoveryPhrase step 4",
      lottie: lottieAnimations[deviceModelId].numberOfWords,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.0.title" />
          ),
        },
        {
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.1.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.1.label" />
          ),
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep" />
      ),
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "secondary",
    id: "existingRecoveryPhrase_1",
  },
  {
    trackPage: "RecoveryPhrase step 5",
    sceneProps: {
      lottie: lottieAnimations[deviceModelId].confirmWords,
      lottieStyle: lottieAnimations[deviceModelId].style,
      bullets: [
        {
          index: 3,
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.2.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.2.label" />
          ),
        },
        {
          index: 4,
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.3.title" />
          ),
          label: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.3.label" />
          ),
        },
        {
          index: 5,
          title: (
            <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.bullets.4.title" />
          ),
        },
      ],
      ctaText: (
        <Trans i18nKey="onboarding.stepRecoveryPhrase.existingRecoveryPhrase.nextStep" />
      ),
    },
    sceneInfoKey: "recoveryPhraseInfoModalProps",
    type: "secondary",
    id: "existingRecoveryPhrase_2",
  },
];

const importAccountsScenes = [
  {
    sceneProps: {
      trackPage: "Import accounts step 1",
      image: syncCryptos,
      title: <Trans i18nKey="onboarding.stepImportAccounts.title" />,
      descs: [<Trans i18nKey="onboarding.stepImportAccounts.desc" />],
      ctaText: <Trans i18nKey="onboarding.stepImportAccounts.cta" />,
      bullets: [
        {
          Icon: Clock,
          label: (
            <Trans i18nKey="onboarding.stepImportAccounts.bullets.0.label">
              {""}
              <LText semiBold />
              {""}
            </Trans>
          ),
        },
        {
          Icon: Clock,
          label: (
            <Trans i18nKey="onboarding.stepImportAccounts.bullets.1.label" />
          ),
        },
        {
          Icon: Check,
          label: (
            <Trans i18nKey="onboarding.stepImportAccounts.bullets.2.label" />
          ),
        },
      ],
      ctaWarningModal: {
        Icon: Warning,
        title: <Trans i18nKey="onboarding.stepImportAccounts.warning.title" />,
        desc: <Trans i18nKey="onboarding.stepImportAccounts.warning.desc" />,
        ctaText: <Trans i18nKey="onboarding.stepImportAccounts.warning.cta" />,
      },
    },
    type: "primary",
    id: "importRecoveryPhrase",
  },
];

export { getSetupDeviceScenes, getRecoveryPhraseScenes, importAccountsScenes };
