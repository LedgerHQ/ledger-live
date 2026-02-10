import { DeviceModelId } from "@ledgerhq/devices";
import React, { useEffect, useState, createContext, useRef } from "react";
import { Routes, Route } from "react-router";
import { CSSTransition } from "react-transition-group";
import { Flex } from "@ledgerhq/react-ui";

// screens
import { Welcome } from "~/renderer/components/Onboarding/Screens/Welcome";
import { SelectDevice } from "~/renderer/components/Onboarding/Screens/SelectDevice";
import { SelectUseCase } from "~/renderer/components/Onboarding/Screens/SelectUseCase";
import Tutorial from "~/renderer/components/Onboarding/Screens/Tutorial";
import styled from "styled-components";
import { Pedagogy } from "~/renderer/components/Onboarding/Pedagogy";
import RecoveryWarning from "~/renderer/components/Onboarding/Help/RecoveryWarning";
import { preloadAssets } from "~/renderer/components/Onboarding/preloadAssets";
import { SideDrawer } from "../SideDrawer";
import Box from "../Box";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboarding from "../SyncOnboarding";
import { OnboardingUseCase } from "./OnboardingUseCase";

const OnboardingContainer = styled(Flex).attrs({
  width: "100%",
  height: "100%",
  position: "relative",
})``;

const DURATION = 200;

const ScreenContainer = styled(Flex).attrs({
  width: "100%",
  height: "100%",
  position: "relative",
})`
  &.page-switch-appear {
    opacity: 0;
  }

  &.page-switch-appear-active {
    opacity: 1;
    transition: opacity ${DURATION}ms ease-in;
  }
`;

type NullableDeviceModelId = DeviceModelId | null;

type OnboardingContextTypes = {
  deviceModelId: NullableDeviceModelId;
  setDeviceModelId: (deviceModelId: NullableDeviceModelId) => void;
};

export const OnboardingContext = createContext<OnboardingContextTypes>({
  deviceModelId: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDeviceModelId: () => {},
});

export function Onboarding() {
  const [useCase, setUseCase] = useState<OnboardingUseCase | null>(null);
  const [deviceModelId, setDeviceModelId] = useState<NullableDeviceModelId>(null);
  const [openedPedagogyModal, setOpenedPedagogyModal] = useState(false);
  const [openedRecoveryPhraseWarningHelp, setOpenedRecoveryPhraseWarningHelp] = useState(false);

  useEffect(() => {
    preloadAssets();
  }, []);

  const nodeRef = useRef(null);

  return (
    <OnboardingContext.Provider value={{ deviceModelId, setDeviceModelId }}>
      <Pedagogy
        isOpen={openedPedagogyModal}
        onClose={() => {
          setOpenedPedagogyModal(false);
        }}
        onDone={() => {
          setOpenedPedagogyModal(false);
        }}
      />
      <SideDrawer
        isOpen={openedRecoveryPhraseWarningHelp}
        onRequestClose={() => {
          setOpenedRecoveryPhraseWarningHelp(false);
        }}
        direction={"left"}
      >
        <Box px={40}>
          <RecoveryWarning />
        </Box>
      </SideDrawer>
      <OnboardingContainer>
        <CSSTransition
          in
          appear
          key="onboarding"
          timeout={DURATION}
          classNames="page-switch"
          nodeRef={nodeRef}
        >
          <ScreenContainer ref={nodeRef}>
            <Routes>
              <Route index element={<Welcome />} />
              <Route path="welcome" element={<Welcome />} />
              <Route path="select-device" element={<SelectDevice />} />
              <Route path="sync/*" element={<SyncOnboarding />} />
              <Route
                path="select-use-case"
                element={
                  <SelectUseCase
                    setOpenedPedagogyModal={setOpenedPedagogyModal}
                    setUseCase={setUseCase}
                  />
                }
              />
              <Route
                path={`${OnboardingUseCase.setupDevice}/*`}
                element={
                  useCase ? (
                    <Tutorial useCase={useCase} deviceModelId={deviceModelId} />
                  ) : (
                    <SelectDevice />
                  )
                }
              />
              <Route
                path={`${OnboardingUseCase.connectDevice}/*`}
                element={
                  useCase ? (
                    <Tutorial useCase={useCase} deviceModelId={deviceModelId} />
                  ) : (
                    <SelectDevice />
                  )
                }
              />
              <Route
                path={`${OnboardingUseCase.recoveryPhrase}/*`}
                element={
                  useCase ? (
                    <Tutorial useCase={useCase} deviceModelId={deviceModelId} />
                  ) : (
                    <SelectDevice />
                  )
                }
              />
              <Route
                path={`${OnboardingUseCase.recover}/*`}
                element={
                  useCase ? (
                    <Tutorial useCase={useCase} deviceModelId={deviceModelId} />
                  ) : (
                    /**
                     * In case we navigate to another screen then do a
                     * navigate(-1) we lose the state here so we fallback to
                     * displaying the stateless device selection screen
                     * One case for that is when we navigate to the USB
                     * troubleshoot screen.
                     */
                    <SelectDevice />
                  )
                }
              />
            </Routes>
          </ScreenContainer>
        </CSSTransition>
      </OnboardingContainer>
    </OnboardingContext.Provider>
  );
}

export default withV3StyleProvider(Onboarding);
