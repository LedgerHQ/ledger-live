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
      title={t("onboarding.pedagogy.heading")}
      steps={[
        {
          bgColor: "palette.constant.purple",
          title: t("onboarding.pedagogy.screens.accessYourCoins.title"),
          description: t("onboarding.pedagogy.screens.accessYourCoins.description"),
          AsideRight: <Illustration size={280} lightSource={bitcoinBox} darkSource={bitcoinBox} />,
        },
        {
          bgColor: "palette.constant.purple",
          title: t("onboarding.pedagogy.screens.ownYourPrivateKey.title"),
          description: t("onboarding.pedagogy.screens.ownYourPrivateKey.description"),
          AsideRight: <Illustration size={280} lightSource={keyInABall} darkSource={keyInABall} />,
        },
        {
          bgColor: "palette.constant.purple",
          title: t("onboarding.pedagogy.screens.stayOffline.title"),
          description: t("onboarding.pedagogy.screens.stayOffline.description"),
          AsideRight: (
            <Illustration size={280} lightSource={lnNoWireless} darkSource={lnNoWireless} />
          ),
        },
        {
          bgColor: "palette.constant.purple",
          title: t("onboarding.pedagogy.screens.validateTransactions.title"),
          description: t("onboarding.pedagogy.screens.validateTransactions.description"),
          AsideRight: (
            <Illustration size={280} lightSource={phoneAndCoins} darkSource={phoneAndCoins} />
          ),
        },
        {
          bgColor: "palette.constant.purple",
          title: t("onboarding.pedagogy.screens.setUpNanoWallet.title"),
          description: t("onboarding.pedagogy.screens.setUpNanoWallet.description"),
          AsideRight: <Illustration size={280} lightSource={lnAndGlass} darkSource={lnAndGlass} />,
          continueLabel: t("onboarding.pedagogy.screens.setUpNanoWallet.CTA"),
        },
      ]}
      onClose={onClose}
      onFinish={onDone}
    />
  );
}
