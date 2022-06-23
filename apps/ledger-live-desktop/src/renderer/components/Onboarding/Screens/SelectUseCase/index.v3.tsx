import React, { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { useTranslation, Trans } from "react-i18next";
import { Text } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { UseCaseOption } from "./UseCaseOption";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Separator } from "./Separator";

import { deviceById } from "~/renderer/components/Onboarding/Screens/SelectDevice/devices";

import { registerAssets } from "~/renderer/components/Onboarding/preloadAssets";
import OnboardingNavHeader from "../../OnboardingNavHeader.v3";

import { track } from "~/renderer/analytics/segment";

import { ScreenId } from "../Tutorial";
import { OnboardingContext, UseCase } from "../../index.v3";

import connectNanoLight from "./assets/connectNanoLight.svg";
import restorePhraseLight from "./assets/restorePhraseLight.svg";
import setupNanoLight from "./assets/setupNanoLight.svg";

import connectNanoDark from "./assets/connectNanoDark.svg";
import restorePhraseDark from "./assets/restorePhraseDark.svg";
import setupNanoDark from "./assets/setupNanoDark.svg";

import Illustration from "~/renderer/components/Illustration";

registerAssets([
  connectNanoLight,
  restorePhraseLight,
  setupNanoLight,
  connectNanoDark,
  restorePhraseDark,
  setupNanoDark,
]);

const SelectUseCaseContainer = styled.div`
  width: 100%;
  padding: 134px 0px;
  display: flex;
  align-items: center;
  flex-direction: column;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0px 160.5px;
  width: 100%;
`;

const LeftColumn = styled.div`
  max-width: 300px;
  display: flex;
  flex-direction: column;
`;

const LeftText = styled(Text).attrs(() => ({
  uppercase: true,
}))`
  color: ${p => p.theme.colors.palette.neutral.c100};
  max-width: 382px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
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
                i18nKey="v3.onboarding.screens.selectUseCase.hasNoRecovery"
                values={{
                  deviceName: device.productName,
                }}
              />
            </LeftText>
          </LeftColumn>
          <RightColumn>
            <UseCaseOption
              id="first-use"
              title={
                <Trans
                  i18nKey="v3.onboarding.screens.selectUseCase.options.1.title"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              description={t("v3.onboarding.screens.selectUseCase.options.1.description")}
              Illu={
                <Illustration lightSource={setupNanoLight} darkSource={setupNanoDark} size={200} />
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
        <Separator label={t("v3.onboarding.screens.selectUseCase.separator")} />
        <Row>
          <LeftColumn>
            <LeftText variant="h3">{t("v3.onboarding.screens.selectUseCase.hasRecovery")}</LeftText>
          </LeftColumn>
          <RightColumn>
            <UseCaseOption
              id="initialized-device"
              title={
                <Trans
                  i18nKey="v3.onboarding.screens.selectUseCase.options.2.title"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              description={t("v3.onboarding.screens.selectUseCase.options.2.description")}
              Illu={
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
                onWrappedUseCase();
              }}
            />
            <UseCaseOption
              id="restore-device"
              title={t("v3.onboarding.screens.selectUseCase.options.3.title")}
              description={
                <Trans
                  i18nKey="v3.onboarding.screens.selectUseCase.options.3.description"
                  values={{
                    deviceName: device.productName,
                  }}
                />
              }
              Illu={
                <Illustration
                  lightSource={restorePhraseLight}
                  darkSource={restorePhraseDark}
                  size={200}
                />
              }
              onClick={() => {
                track("Onboarding - Restore");
                setUseCase(UseCase.recoveryPhrase);
                history.push(
                  `/onboarding/${UseCase.recoveryPhrase}/${ScreenId.importYourRecoveryPhrase}`,
                );
                onWrappedUseCase();
              }}
            />
          </RightColumn>
        </Row>
      </SelectUseCaseContainer>
    </ScrollArea>
  );
}
