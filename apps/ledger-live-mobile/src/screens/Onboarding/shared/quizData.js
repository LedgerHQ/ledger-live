// @flow
import React from "react";
import { Trans } from "react-i18next";

export default [
  {
    label: <Trans i18nKey="onboarding.quizz.label" />,
    title: <Trans i18nKey="onboarding.quizz.coins.title" />,
    modal: {
      success: <Trans i18nKey="onboarding.quizz.modal.success" />,
      fail: <Trans i18nKey="onboarding.quizz.modal.fail" />,
      text: <Trans i18nKey="onboarding.quizz.coins.modal.text" />,
      cta: <Trans i18nKey="onboarding.quizz.coins.modal.cta" />,
    },
    answers: [
      {
        title: <Trans i18nKey="onboarding.quizz.coins.answers.wrong" />,
        correct: false,
      },
      {
        title: <Trans i18nKey="onboarding.quizz.coins.answers.correct" />,
        correct: true,
      },
    ],
  },
  {
    label: <Trans i18nKey="onboarding.quizz.label" />,
    title: <Trans i18nKey="onboarding.quizz.recoveryPhrase.title" />,
    modal: {
      success: <Trans i18nKey="onboarding.quizz.modal.success" />,
      fail: <Trans i18nKey="onboarding.quizz.modal.fail" />,
      text: <Trans i18nKey="onboarding.quizz.recoveryPhrase.modal.text" />,
      cta: <Trans i18nKey="onboarding.quizz.recoveryPhrase.modal.cta" />,
    },
    answers: [
      {
        title: (
          <Trans i18nKey="onboarding.quizz.recoveryPhrase.answers.correct" />
        ),
        correct: true,
      },
      {
        title: (
          <Trans i18nKey="onboarding.quizz.recoveryPhrase.answers.wrong" />
        ),
        correct: false,
      },
    ],
  },
  {
    label: <Trans i18nKey="onboarding.quizz.label" />,
    title: <Trans i18nKey="onboarding.quizz.privateKey.title" />,
    modal: {
      success: <Trans i18nKey="onboarding.quizz.modal.success" />,
      fail: <Trans i18nKey="onboarding.quizz.modal.fail" />,
      text: <Trans i18nKey="onboarding.quizz.privateKey.modal.text" />,
      cta: <Trans i18nKey="onboarding.quizz.privateKey.modal.cta" />,
    },
    answers: [
      {
        title: <Trans i18nKey="onboarding.quizz.privateKey.answers.correct" />,
        correct: true,
      },
      {
        title: <Trans i18nKey="onboarding.quizz.privateKey.answers.wrong" />,
        correct: false,
      },
    ],
  },
];
