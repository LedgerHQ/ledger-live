import React, { useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation, Trans } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useFeature } from "@features/platform-feature-flags";
import { isRecoverDisplayed } from "@ledgerhq/live-common/recover/isRecoverDisplayed";
import { useDispatch } from "LLD/hooks/redux";
import styled from "styled-components";
import { UseCaseOption } from "./UseCaseOption";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { Separator } from "./Separator";
import { registerAssets } from "~/renderer/components/Onboarding/preloadAssets";
import OnboardingNavHeader from "../../OnboardingNavHeader";
import { track } from "~/renderer/analytics/segment";
import { ScreenId } from "../Tutorial";
import { OnboardingContext } from "../../index";
import { OnboardingUseCase } from "../../OnboardingUseCase";
import connectNanoLight from "./assets/connectNanoLight.png";
import restorePhraseLight from "./assets/restorePhraseLight.png";
import setupNanoLight from "./assets/setupNanoLight.png";
import connectNanoDark from "./assets/connectNanoDark.png";
import restorePhraseDark from "./assets/restorePhraseDark.png";
import setupNanoDark from "./assets/setupNanoDark.png";
import restoreUsingRecoverDark from "./assets/restoreUsingRecoverDark.png";

import Illustration from "~/renderer/components/Illustration";
import { openModal } from "~/renderer/actions/modals";
import CounterfeitWarningDialog from "LLD/features/Onboarding/components/CounterfeitWarningDialog";
import { isLegacyNano } from "LLD/features/Onboarding/utils/isLegacyNano";

registerAssets([
  connectNanoLight,
  restorePhraseLight,
  setupNanoLight,
  connectNanoDark,
  restorePhraseDark,
  setupNanoDark,
  restoreUsingRecoverDark,
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
  color: ${p => p.theme.colors.neutral.c100};
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
  setUseCase: (useCase: OnboardingUseCase) => void;
  setOpenedPedagogyModal: (isOpened: boolean) => void;
};

type UseCaseAction = "setup" | "connect" | "restore" | "recover";

const USE_CASE_BUTTON_TRACKING: Record<
  UseCaseAction,
  { button: string; seedConfiguration: string }
> = {
  setup: { button: "Create a new wallet", seedConfiguration: "new_seed" },
  connect: { button: "Connect your device", seedConfiguration: "connect_device" },
  restore: { button: "Restore with your secret phrase", seedConfiguration: "restore_seed" },
  recover: { button: "Restore with ledger recover", seedConfiguration: "recover_seed" },
};

const trackUseCaseButtonClicked = (
  action: UseCaseAction,
  deviceModelId: DeviceModelId | null | undefined,
) => {
  const { button, seedConfiguration } = USE_CASE_BUTTON_TRACKING[action];
  track("button_clicked", {
    button,
    deviceModelId,
    seedConfiguration,
  });
};

export function SelectUseCase({ setUseCase, setOpenedPedagogyModal }: Props) {
  const { t } = useTranslation();
  const { deviceModelId } = useContext(OnboardingContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const servicesConfig = useFeature("protectServicesDesktop");
  const counterfeitWarningFeature = useFeature("lwdOnboardingCounterfeitWarning");
  const shouldShowCounterfeitWarning =
    counterfeitWarningFeature?.enabled === true && isLegacyNano(deviceModelId);
  const [pendingAction, setPendingAction] = useState<UseCaseAction | null>(null);

  const runAction = useCallback(
    (action: UseCaseAction) => {
      switch (action) {
        case "setup":
          track("Onboarding - Setup new");
          setUseCase(OnboardingUseCase.setupDevice);
          setOpenedPedagogyModal(true);
          navigate(`/onboarding/${OnboardingUseCase.setupDevice}/${ScreenId.howToGetStarted}`);
          return;
        case "connect":
          track("Onboarding - Connect");
          setUseCase(OnboardingUseCase.connectDevice);
          navigate(`/onboarding/${OnboardingUseCase.connectDevice}/${ScreenId.pairMyNano}`);
          return;
        case "restore":
          track("Onboarding - Restore");
          setUseCase(OnboardingUseCase.recoveryPhrase);
          navigate(
            `/onboarding/${OnboardingUseCase.recoveryPhrase}/${ScreenId.importYourRecoveryPhrase}`,
          );
          return;
        case "recover":
          track("Onboarding - Restore With Recover");
          if (deviceModelId === DeviceModelId.nanoS) {
            dispatch(openModal("MODAL_PROTECT_DISCOVER", undefined));
          } else {
            setUseCase(OnboardingUseCase.recover);
            navigate(`/onboarding/${OnboardingUseCase.recover}/${ScreenId.recoverHowTo}`);
          }
          return;
      }
    },
    [deviceModelId, dispatch, navigate, setOpenedPedagogyModal, setUseCase],
  );

  const runWithCounterfeitWarningGate = useCallback(
    (action: UseCaseAction) => {
      trackUseCaseButtonClicked(action, deviceModelId);
      if (shouldShowCounterfeitWarning) {
        setPendingAction(action);
        return;
      }
      runAction(action);
    },
    [deviceModelId, runAction, shouldShowCounterfeitWarning],
  );

  const handleCounterfeitWarningProceed = useCallback(() => {
    const action = pendingAction;
    setPendingAction(null);
    if (action) {
      runAction(action);
    }
  }, [pendingAction, runAction]);

  const handleCounterfeitWarningDismiss = useCallback(() => {
    setPendingAction(null);
  }, []);

  return (
    <>
      <ScrollArea withHint>
        <OnboardingNavHeader onClickPrevious={() => navigate("/onboarding/select-device")} />
        <SelectUseCaseContainer>
          <Row>
            <LeftColumn>
              <LeftText variant="h3">
                <Trans
                  i18nKey="onboarding.screens.selectUseCase.hasNoRecovery"
                  values={{
                    deviceName: t("devices." + deviceModelId),
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
                      deviceName: t("devices." + deviceModelId),
                    }}
                  />
                }
                description={t("onboarding.screens.selectUseCase.options.1.description")}
                illustration={
                  <Illustration
                    lightSource={setupNanoLight}
                    darkSource={setupNanoDark}
                    size={220}
                  />
                }
                onClick={() => runWithCounterfeitWarningGate("setup")}
              />
            </RightColumn>
          </Row>
          <Separator />
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
                      deviceName: t("devices." + deviceModelId),
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
                onClick={() => runWithCounterfeitWarningGate("connect")}
              />
              <UseCaseOption
                dataTestId="v3-onboarding-restore-device"
                id="restore-device"
                title={t("onboarding.screens.selectUseCase.options.3.title")}
                description={
                  <Trans
                    i18nKey="onboarding.screens.selectUseCase.options.3.description"
                    values={{
                      deviceName: t("devices." + deviceModelId),
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
                onClick={() => runWithCounterfeitWarningGate("restore")}
              />
              {isRecoverDisplayed(servicesConfig, deviceModelId) && (
                <UseCaseOption
                  dataTestId="v3-onboarding-restore-using-recover"
                  id="restore-device"
                  title={t("onboarding.screens.selectUseCase.options.4.title")}
                  description={
                    <Trans i18nKey="onboarding.screens.selectUseCase.options.4.description" />
                  }
                  illustration={
                    <Illustration
                      lightSource={restoreUsingRecoverDark}
                      darkSource={restoreUsingRecoverDark}
                      size={220}
                    />
                  }
                  onClick={() => runWithCounterfeitWarningGate("recover")}
                />
              )}
            </RightColumn>
          </Row>
        </SelectUseCaseContainer>
      </ScrollArea>
      {shouldShowCounterfeitWarning && deviceModelId ? (
        <CounterfeitWarningDialog
          open={pendingAction !== null}
          deviceModelId={deviceModelId}
          onProceed={handleCounterfeitWarningProceed}
          onDismiss={handleCounterfeitWarningDismiss}
        />
      ) : null}
    </>
  );
}
