import React from "react";
import { Platform } from "react-native";
import { Trans } from "react-i18next";
import pinCodeNanoXLight from "../assets/nanoX/pinCode/light.json";
import pinCodeNanoXDark from "../assets/nanoX/pinCode/dark.json";
import pinCodeNanoSLight from "../assets/nanoS/pinCode/light.json";
import pinCodeNanoSDark from "../assets/nanoS/pinCode/dark.json";
import pinCodeNanoSPLight from "../assets/nanoSP/pinCode/light.json";
import pinCodeNanoSPDark from "../assets/nanoSP/pinCode/dark.json";
import pinCodeStaxLight from "../assets/stax/pinCode/light.json";
import pinCodeStaxDark from "../assets/stax/pinCode/dark.json";
import recoverNanoXLight from "../assets/nanoX/recover/light.json";
import recoverNanoXDark from "../assets/nanoX/recover/dark.json";
import recoverNanoSLight from "../assets/nanoS/recover/light.json";
import recoverNanoSDark from "../assets/nanoS/recover/dark.json";
import recoverNanoSPLight from "../assets/nanoSP/recover/light.json";
import recoverNanoSPDark from "../assets/nanoSP/recover/dark.json";
import recoverStaxLight from "../assets/stax/recover/light.json";
import recoverStaxDark from "../assets/stax/recover/dark.json";
import confirmWordsNanoXLight from "../assets/nanoX/confirmWords/light.json";
import confirmWordsNanoXDark from "../assets/nanoX/confirmWords/dark.json";
import confirmWordsNanoSLight from "../assets/nanoS/confirmWords/light.json";
import confirmWordsNanoSDark from "../assets/nanoS/confirmWords/dark.json";
import confirmWordsNanoSPLight from "../assets/nanoSP/confirmWords/light.json";
import confirmWordsNanoSPDark from "../assets/nanoSP/confirmWords/dark.json";
import confirmWordsStaxLight from "../assets/stax/confirmWords/light.json";
import confirmWordsStaxDark from "../assets/stax/confirmWords/dark.json";
import numberOfWordsNanoXLight from "../assets/nanoX/numberOfWords/light.json";
import numberOfWordsNanoXDark from "../assets/nanoX/numberOfWords/dark.json";
import numberOfWordsNanoSLight from "../assets/nanoS/numberOfWords/light.json";
import numberOfWordsNanoSDark from "../assets/nanoS/numberOfWords/dark.json";
import numberOfWordsNanoSPLight from "../assets/nanoSP/numberOfWords/light.json";
import numberOfWordsNanoSPDark from "../assets/nanoSP/numberOfWords/dark.json";
import numberOfWordsStaxLight from "../assets/stax/numberOfWords/light.json";
import numberOfWordsStaxDark from "../assets/stax/numberOfWords/dark.json";
import powerOnNanoXLight from "../assets/nanoX/powerOn/light.json";
import powerOnNanoXDark from "../assets/nanoX/powerOn/dark.json";
import powerOnNanoSLight from "../assets/nanoS/powerOn/light.json";
import powerOnNanoSDark from "../assets/nanoS/powerOn/dark.json";
import powerOnNanoSPLight from "../assets/nanoSP/powerOn/light.json";
import powerOnNanoSPDark from "../assets/nanoSP/powerOn/dark.json";
import powerOnStaxLight from "../assets/stax/powerOn/light.json";
import powerOnStaxDark from "../assets/stax/powerOn/dark.json";
import powerOnRecoveryNanoXLight from "../assets/nanoX/powerOnRecovery/light.json";
import powerOnRecoveryNanoXDark from "../assets/nanoX/powerOnRecovery/dark.json";
import powerOnRecoveryNanoSLight from "../assets/nanoS/powerOnRecovery/light.json";
import powerOnRecoveryNanoSDark from "../assets/nanoS/powerOnRecovery/dark.json";
import powerOnRecoveryNanoSPLight from "../assets/nanoSP/powerOnRecovery/light.json";
import powerOnRecoveryNanoSPDark from "../assets/nanoSP/powerOnRecovery/dark.json";
import powerOnRecoveryStaxLight from "../assets/stax/powerOnRecovery/light.json";
import powerOnRecoveryStaxDark from "../assets/stax/powerOnRecovery/dark.json";
import Check from "~/icons/Check";
import WarningOutline from "~/icons/WarningOutline";
import Close from "~/icons/Close";
import ArrowRight from "~/icons/ArrowRight";
import LText from "~/components/LText";
import { urls } from "~/utils/urls";

export const lottieAnimations = {
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
  stax: {
    pinCode: {
      light: pinCodeStaxLight,
      dark: pinCodeStaxDark,
    },
    recover: {
      light: recoverStaxLight,
      dark: recoverStaxDark,
    },
    confirmWords: {
      light: confirmWordsStaxLight,
      dark: confirmWordsStaxDark,
    },
    numberOfWords: {
      light: numberOfWordsStaxLight,
      dark: numberOfWordsStaxDark,
    },
    powerOn: {
      light: powerOnStaxLight,
      dark: powerOnStaxDark,
    },
    powerOnRecovery: {
      light: powerOnRecoveryStaxLight,
      dark: powerOnRecoveryStaxDark,
    },
    style: {},
  },
};
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
