import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Flex } from "@ledgerhq/react-ui";
import ModalStepper from "../../ModalStepper";
import Illustration from "~/renderer/components/Illustration";

import bitcoinBoxLight from "./assets/bitcoinBoxLight.svg";
import keyInABallLight from "./assets/keyInABallLight.svg";
import lnAndGlassLight from "./assets/lnAndGlassLight.svg";
import lnNoWirelessLight from "./assets/lnNoWirelessLight.svg";
import phoneAndCoinsLight from "./assets/phoneAndCoinsLight.svg";

type PedagogyProps = {
  isOpen: boolean;
  onDone: () => void;
  onClose: () => void;
};

export function Pedagogy({ isOpen, onDone, onClose }: PedagogyProps) {
  const { t } = useTranslation();

  return (
    <ModalStepper
      isOpen={isOpen}
      title={t("v3.onboarding.pedagogy.heading")}
      steps={[
        {
          title: t("v3.onboarding.pedagogy.screens.accessYourCoins.title"),
          description: t("v3.onboarding.pedagogy.screens.accessYourCoins.description"),
          AsideRight: (
            <Illustration size={280} lightSource={bitcoinBoxLight} darkSource={bitcoinBoxLight} />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.ownYourPrivateKey.title"),
          description: t("v3.onboarding.pedagogy.screens.ownYourPrivateKey.description"),
          AsideRight: (
            <Illustration size={280} lightSource={keyInABallLight} darkSource={keyInABallLight} />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.stayOffline.title"),
          description: t("v3.onboarding.pedagogy.screens.stayOffline.description"),
          AsideRight: (
            <Illustration
              size={280}
              lightSource={lnNoWirelessLight}
              darkSource={lnNoWirelessLight}
            />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.validateTransactions.title"),
          description: t("v3.onboarding.pedagogy.screens.validateTransactions.description"),
          AsideRight: (
            <Illustration
              size={280}
              lightSource={phoneAndCoinsLight}
              darkSource={phoneAndCoinsLight}
            />
          ),
        },
        {
          title: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.title"),
          description: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.description"),
          AsideRight: (
            <Illustration size={280} lightSource={lnAndGlassLight} darkSource={lnAndGlassLight} />
          ),
          continueLabel: t("v3.onboarding.pedagogy.screens.setUpNanoWallet.CTA"),
        },
      ]}
      onClose={onClose}
      onFinish={onDone}
    />
  );
}
