import React, { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { useTranslation, Trans } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { UseCaseOption } from "./UseCaseOption";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Separator } from "./Separator";

import { deviceById } from "~/renderer/components/Onboarding/Screens/SelectDevice/devices";

import { registerAssets } from "~/renderer/components/Onboarding/preloadAssets";
import OnboardingNavHeader from "../../OnboardingNavHeader";

import { track } from "~/renderer/analytics/segment";

import { ScreenId } from "../Tutorial";
import { OnboardingContext, UseCase } from "../../index";

import connectNanoLight from "./assets/connectNanoLight.png";
import restorePhraseLight from "./assets/restorePhraseLight.png";
import setupNanoLight from "./assets/setupNanoLight.png";

import connectNanoDark from "./assets/connectNanoDark.png";
import restorePhraseDark from "./assets/restorePhraseDark.png";
import setupNanoDark from "./assets/setupNanoDark.png";

import Illustration from "~/renderer/components/Illustration";

registerAssets([
  connectNanoLight,
  restorePhraseLight,
  setupNanoLight,
  connectNanoDark,
  restorePhraseDark,
  setupNanoDark,
]);

const SelectUseCaseContainer = styled(Flex).attrs({
  width: "100%",
  padding: "134px 0px",
  alignItems: "center",
  flexDirection: "column",
  boxSizing: "border-box",
})``;

const Row = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  padding: "0px 160.5px",
  width: "100%",
})``;

const LeftColumn = styled(Flex).attrs({
  maxWidth: "300px",
  flexDirection: "column",
})``;

const LeftText = styled(Text).attrs(() => ({
  uppercase: true,
}))`
  color: ${p => p.theme.colors.palette.neutral.c100};
  max-width: 382px;
`;

const RightColumn = styled(Flex).attrs({
  flexDirection: "column",
})`
  & > * {
    margin: 10px 0px;
  }

  & > :first-child {
    margin-top: 0px;
  }

  & > :last-child {
    margin-bottom: 0px;
  }
`;

type Props = {
  setUseCase: (useCase: UseCase) => void;
  setOpenedPedagogyModal: (isOpened: boolean) => void;
};

export function SelectUseCase({ setUseCase, setOpenedPedagogyModal }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { deviceModelId } = useContext(OnboardingContext);
  const history = useHistory();
  const device = deviceById(deviceModelId);

  const onWrappedUseCase = useCallback(() => {
    dispatch(openModal("MODAL_RECOVERY_SEED_WARNING", { deviceModelId }));
  }, [deviceModelId, dispatch]);

  return (
    <ScrollArea withHint>
      <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
      <SelectUseCaseContainer>
        <Row>
          <LeftColumn>
            <LeftText variant="h3">
              <Trans
                i18nKey="onboarding.screens.selectUseCase.hasNoRecovery"
                values={{
                  deviceName: device.productName,
                }}
              />
            </LeftText>
          </LeftColumn>
          <RightColumn>
            <UseCaseOption
              dataTestId="v3-onboarding-new-device"
              id="first-use"
              title={
                <Trans
                  i18nKey="onboarding.screens.selectUseCase.options.1.title"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              description={t("onboarding.screens.selectUseCase.options.1.description")}
              illustration={
                <Illustration lightSource={setupNanoLight} darkSource={setupNanoDark} size={220} />
              }
              onClick={() => {
                track("Onboarding - Setup new");
                setUseCase(UseCase.setupDevice);
                setOpenedPedagogyModal(true);
                history.push(`/onboarding/${UseCase.setupDevice}/${ScreenId.howToGetStarted}`);
              }}
            />
          </RightColumn>
        </Row>
        <Separator label={t("onboarding.screens.selectUseCase.separator")} />
        <Row>
          <LeftColumn>
            <LeftText variant="h3">{t("onboarding.screens.selectUseCase.hasRecovery")}</LeftText>
          </LeftColumn>
          <RightColumn>
            <UseCaseOption
              dataTestId="v3-onboarding-initialized-device"
              id="initialized-device"
              title={
                <Trans
                  i18nKey="onboarding.screens.selectUseCase.options.2.title"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              description={t("onboarding.screens.selectUseCase.options.2.description")}
              illustration={
                <Illustration
                  lightSource={connectNanoLight}
                  darkSource={connectNanoDark}
                  size={200}
                />
              }
              onClick={() => {
                track("Onboarding - Connect");
                setUseCase(UseCase.connectDevice);
                history.push(`/onboarding/${UseCase.connectDevice}/${ScreenId.pairMyNano}`);
                // onWrappedUseCase();
              }}
            />
            <UseCaseOption
              dataTestId="v3-onboarding-restore-device"
              id="restore-device"
              title={t("onboarding.screens.selectUseCase.options.3.title")}
              description={
                <Trans
                  i18nKey="onboarding.screens.selectUseCase.options.3.description"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              illustration={
                <Illustration
                  lightSource={restorePhraseLight}
                  darkSource={restorePhraseDark}
                  size={220}
                />
              }
              onClick={() => {
                track("Onboarding - Restore");
                setUseCase(UseCase.recoveryPhrase);
                history.push(
                  `/onboarding/${UseCase.recoveryPhrase}/${ScreenId.importYourRecoveryPhrase}`,
                );
                //onWrappedUseCase();
              }}
            />
          </RightColumn>
        </Row>
      </SelectUseCaseContainer>
    </ScrollArea>
  );
}
