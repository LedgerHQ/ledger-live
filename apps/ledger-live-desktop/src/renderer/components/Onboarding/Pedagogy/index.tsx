import React from "react";
import { useTranslation } from "react-i18next";
import ModalStepper from "../../ModalStepper";
import Illustration from "~/renderer/components/Illustration";

import bitcoinBox from "./assets/bitcoinBox.png";
import keyInABall from "./assets/keyInABall.png";
import lnAndGlass from "./assets/lnAndGlass.png";
import lnNoWireless from "./assets/lnNoWireless.png";
import phoneAndCoins from "./assets/phoneAndCoins.png";

type PedagogyProps = {
  isOpen: boolean;
  onDone: () => void;
  onClose: () => void;
};

export function Pedagogy({ isOpen, onDone, onClose }: PedagogyProps) {
  const { t } = useTranslation();

  return (
    <ModalStepper
      dataTestId="v3-onboarding-pedagogy-modal"
      isOpen={isOpen}
      title={t("v3.onboarding.pedagogy.heading")}
      steps={[
        {
          title: t("v3.onboarding.pedagogy.screens.accessYourCoins.title"),
          description: t("v3.onboarding.pedagogy.screens.accessYourCoins.description"),
          AsideRight: <Illustration size={280} lightSource={bitcoinBox} darkSource={bitcoinBox} />,
        },
        {
          title: t("v3.onboarding.pedagogy.screens.ownYourPrivateKey.title"),
          description: t("v3.onboarding.pedagogy.screens.ownYourPrivateKey.description"),
          AsideRight: <Illustration size={280} lightSource={keyInABall} darkSource={keyInABall} />,
        },
        {
          title: t("v3.onboarding.pedagogy.screens.stayOffline.title"),
          description: t("v3.onboarding.pedagogy.screens.stayOffline.description"),
          AsideRight: (
            <Illustration size={280} lightSource={lnNoWireless} darkSource={lnNoWireless} />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.validateTransactions.title"),
          description: t("v3.onboarding.pedagogy.screens.validateTransactions.description"),
          AsideRight: (
            <Illustration size={280} lightSource={phoneAndCoins} darkSource={phoneAndCoins} />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.title"),
          description: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.description"),
          AsideRight: <Illustration size={280} lightSource={lnAndGlass} darkSource={lnAndGlass} />,
          continueLabel: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.CTA"),
        },
      ]}
      onClose={onClose}
      onFinish={onDone}
    />
  );
}
