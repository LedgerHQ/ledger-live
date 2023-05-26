/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import Animation from "~/renderer/animations";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody, RenderProps } from "~/renderer/components/Modal";
import Select from "~/renderer/components/Select";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { AnimationKey, getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceModelId } from "@ledgerhq/devices";

// All animations used on onboarding

/*
  Important: this block is excluded from the ts type checking.
  The json files are too big and blow up the visual studio code TS plugin.
*/

// @ts-ignore
import NanoSConfirmWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/confirmWords/light.json";
// @ts-ignore
import NanoSConfirmWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/confirmWords/dark.json";
// @ts-ignore
import NanoSNumberOfWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/numberOfWords/light.json";
// @ts-ignore
import NanoSNumberOfWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/numberOfWords/dark.json";
// @ts-ignore
import NanoSPinCodeLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/pinCode/light.json";
// @ts-ignore
import NanoSPinCodeDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/pinCode/dark.json";
// @ts-ignore
import NanoSPowerOnRecoveryLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/powerOnRecovery/light.json";
// @ts-ignore
import NanoSPowerOnRecoveryDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/powerOnRecovery/dark.json";
// @ts-ignore
import NanoSPowerOnLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/powerOn/light.json";
// @ts-ignore
import NanoSPowerOnDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/powerOn/dark.json";
// @ts-ignore
import NanoSRecoverLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/recover/light.json";
// @ts-ignore
import NanoSRecoverDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/recover/dark.json";
// @ts-ignore
import NanoSPlugDeviceLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/plugDevice/light.json";
// @ts-ignore
import NanoSPlugDeviceDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoS/plugDevice/dark.json";
// @ts-ignore
import NanoSPConfirmWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/confirmWords/light.json";
// @ts-ignore
import NanoSPConfirmWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/confirmWords/dark.json";
// @ts-ignore
import NanoSPNumberOfWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/numberOfWords/light.json";
// @ts-ignore
import NanoSPNumberOfWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/numberOfWords/dark.json";
// @ts-ignore
import NanoSPPinCodeLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/pinCode/light.json";
// @ts-ignore
import NanoSPPinCodeDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/pinCode/dark.json";
// @ts-ignore
import NanoSPPowerOnRecoveryLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/powerOnRecovery/light.json";
// @ts-ignore
import NanoSPPowerOnRecoveryDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/powerOnRecovery/dark.json";
// @ts-ignore
import NanoSPPowerOnLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/powerOn/light.json";
// @ts-ignore
import NanoSPPowerOnDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/powerOn/dark.json";
// @ts-ignore
import NanoSPRecoverLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/recover/light.json";
// @ts-ignore
import NanoSPRecoverDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/recover/dark.json";
// @ts-ignore
import NanoSPPlugDeviceLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/plugDevice/light.json";
// @ts-ignore
import NanoSPPlugDeviceDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoSP/plugDevice/dark.json";
// @ts-ignore
import NanoXConfirmWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/confirmWords/light.json";
// @ts-ignore
import NanoXConfirmWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/confirmWords/dark.json";
// @ts-ignore
import NanoXNumberOfWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/numberOfWords/light.json";
// @ts-ignore
import NanoXNumberOfWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/numberOfWords/dark.json";
// @ts-ignore
import NanoXPinCodeLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/pinCode/light.json";
// @ts-ignore
import NanoXPinCodeDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/pinCode/dark.json";
// @ts-ignore
import NanoXPowerOnRecoveryLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/powerOnRecovery/light.json";
// @ts-ignore
import NanoXPowerOnRecoveryDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/powerOnRecovery/dark.json";
// @ts-ignore
import NanoXPowerOnLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/powerOn/light.json";
// @ts-ignore
import NanoXPowerOnDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/powerOn/dark.json";
// @ts-ignore
import NanoXRecoverLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/recover/light.json";
// @ts-ignore
import NanoXRecoverDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/recover/dark.json";
// @ts-ignore
import NanoXPlugDeviceLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/plugDevice/light.json";
// @ts-ignore
import NanoXPlugDeviceDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/nanoX/plugDevice/dark.json";
// @ts-ignore
import StaxConfirmWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/confirmWords/light.json";
// @ts-ignore
import StaxConfirmWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/confirmWords/dark.json";
// @ts-ignore
import StaxNumberOfWordsLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/numberOfWords/light.json";
// @ts-ignore
import StaxNumberOfWordsDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/numberOfWords/dark.json";
// @ts-ignore
import StaxPinCodeLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/pinCode/light.json";
// @ts-ignore
import StaxPinCodeDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/pinCode/dark.json";
// @ts-ignore
import StaxPowerOnRecoveryLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/powerOnRecovery/light.json";
// @ts-ignore
import StaxPowerOnRecoveryDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/powerOnRecovery/dark.json";
// @ts-ignore
import StaxPowerOnLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/powerOn/light.json";
// @ts-ignore
import StaxPowerOnDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/powerOn/dark.json";
// @ts-ignore
import StaxRecoverLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/recover/light.json";
// @ts-ignore
import StaxRecoverDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/recover/dark.json";
// @ts-ignore
import StaxPlugDeviceLight from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/plugDevice/light.json";
// @ts-ignore
import StaxPlugDeviceDark from "~/renderer/components/Onboarding/Screens/Tutorial/assets/animations/stax/plugDevice/dark.json";

const AnimationWrapper = styled.div<{ dark?: boolean }>`
  width: 600px;
  max-width: 100%;
  padding-bottom: 0px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => (p.dark ? "#000" : "#fff")};
`;
export const lottieAnimations = {
  nanoS: {
    confirmWords: {
      light: NanoSConfirmWordsLight,
      dark: NanoSConfirmWordsDark,
    },
    numberOfWords: {
      light: NanoSNumberOfWordsLight,
      dark: NanoSNumberOfWordsDark,
    },
    pinCode: {
      light: NanoSPinCodeLight,
      dark: NanoSPinCodeDark,
    },
    powerOnRecovery: {
      light: NanoSPowerOnRecoveryLight,
      dark: NanoSPowerOnRecoveryDark,
    },
    powerOn: {
      light: NanoSPowerOnLight,
      dark: NanoSPowerOnDark,
    },
    recover: {
      light: NanoSRecoverLight,
      dark: NanoSRecoverDark,
    },
    plugDevice: {
      light: NanoSPlugDeviceLight,
      dark: NanoSPlugDeviceDark,
    },
  },
  nanoSP: {
    confirmWords: {
      light: NanoSPConfirmWordsLight,
      dark: NanoSPConfirmWordsDark,
    },
    numberOfWords: {
      light: NanoSPNumberOfWordsLight,
      dark: NanoSPNumberOfWordsDark,
    },
    pinCode: {
      light: NanoSPPinCodeLight,
      dark: NanoSPPinCodeDark,
    },
    powerOnRecovery: {
      light: NanoSPPowerOnRecoveryLight,
      dark: NanoSPPowerOnRecoveryDark,
    },
    powerOn: {
      light: NanoSPPowerOnLight,
      dark: NanoSPPowerOnDark,
    },
    recover: {
      light: NanoSPRecoverLight,
      dark: NanoSPRecoverDark,
    },
    plugDevice: {
      light: NanoSPPlugDeviceLight,
      dark: NanoSPPlugDeviceDark,
    },
  },
  stax: {
    confirmWords: {
      light: StaxConfirmWordsLight,
      dark: StaxConfirmWordsDark,
    },
    numberOfWords: {
      light: StaxNumberOfWordsLight,
      dark: StaxNumberOfWordsDark,
    },
    pinCode: {
      light: StaxPinCodeLight,
      dark: StaxPinCodeDark,
    },
    powerOnRecovery: {
      light: StaxPowerOnRecoveryLight,
      dark: StaxPowerOnRecoveryDark,
    },
    powerOn: {
      light: StaxPowerOnLight,
      dark: StaxPowerOnDark,
    },
    recover: {
      light: StaxRecoverLight,
      dark: StaxRecoverDark,
    },
    plugDevice: {
      light: StaxPlugDeviceLight,
      dark: StaxPlugDeviceDark,
    },
  },
  nanoX: {
    confirmWords: {
      light: NanoXConfirmWordsLight,
      dark: NanoXConfirmWordsDark,
    },
    numberOfWords: {
      light: NanoXNumberOfWordsLight,
      dark: NanoXNumberOfWordsDark,
    },
    pinCode: {
      light: NanoXPinCodeLight,
      dark: NanoXPinCodeDark,
    },
    powerOnRecovery: {
      light: NanoXPowerOnRecoveryLight,
      dark: NanoXPowerOnRecoveryDark,
    },
    powerOn: {
      light: NanoXPowerOnLight,
      dark: NanoXPowerOnDark,
    },
    recover: {
      light: NanoXRecoverLight,
      dark: NanoXRecoverDark,
    },
    plugDevice: {
      light: NanoXPlugDeviceLight,
      dark: NanoXPlugDeviceDark,
    },
  },
};
const LottieDebugger = ({ name }: { name: string }) => {
  const keys = useMemo(
    () => [
      "plugAndPinCode",
      "enterPinCode",
      "quitApp",
      "allowManager",
      "openApp",
      "verify",
      "sign",
      "installLoading",
      "firmwareUpdating",
    ],
    [],
  );
  const onBoardingKeys = useMemo(
    () => [
      "pinCode",
      "recover",
      "confirmWords",
      "numberOfWords",
      "powerOn",
      "powerOnRecovery",
      "plugDevice",
    ],
    [],
  );
  const [modelId, setModelId] = useState<DeviceModelId>(DeviceModelId.nanoS);
  const [key, setKey] = useState<AnimationKey>("enterPinCode");
  const allKeys = [...keys, ...onBoardingKeys];
  const animation = useMemo(() => {
    if (keys.includes(key)) {
      // Normal deviceAction animations
      return getDeviceAnimation(modelId, "light", key);
    }
    if (onBoardingKeys.includes(key) && modelId !== "blue") {
      // @ts-expect-error Complicated to prove that key is statically right
      return lottieAnimations[modelId][key].light;
    }
    return null;
    // Onboarding animations
  }, [key, keys, modelId, onBoardingKeys]);
  const animation2 = useMemo(() => {
    if (keys.includes(key)) {
      // Normal deviceAction animations
      return getDeviceAnimation(modelId, "dark", key);
    }
    if (onBoardingKeys.includes(key) && modelId !== "blue") {
      // @ts-expect-error Complicated to prove that key is statically right
      return lottieAnimations[modelId][key].dark;
    }
    return null;
    // Onboarding animations
  }, [key, keys, modelId, onBoardingKeys]);
  return (
    <Modal
      name={name}
      centered
      render={({ onClose }: RenderProps<unknown>) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testAnimations.title" />}
          noScroll
          render={() => (
            <ScrollArea>
              <Alert type="warning">
                {
                  "This is a tool provided as-is for the team to validate lottie animations used in the app."
                }
              </Alert>
              <div>{!key ? "Select Animation" : `Showing '${key}' for ${modelId}`}</div>
              <AnimationWrapper>
                <Animation animation={animation} />
              </AnimationWrapper>
              <AnimationWrapper dark>
                <Animation animation={animation2} />
              </AnimationWrapper>
              <Box mt={2} mb={2} horizontal>
                <Button
                  mr={2}
                  primary
                  onClick={() => {
                    setModelId(DeviceModelId.nanoS);
                  }}
                >
                  Nano S
                </Button>
                <Button
                  mr={2}
                  primary
                  onClick={() => {
                    setModelId(DeviceModelId.nanoSP);
                  }}
                >
                  Nano S Plus
                </Button>
                <Button
                  mr={2}
                  primary
                  onClick={() => {
                    setModelId(DeviceModelId.nanoX);
                  }}
                >
                  Nano X
                </Button>
                <Button
                  primary
                  onClick={() => {
                    setModelId(DeviceModelId.stax);
                  }}
                >
                  Stax
                </Button>
              </Box>
              <Box>
                <Select
                  isSearchable={false}
                  onChange={option => {
                    if (option) {
                      setModelId(DeviceModelId.nanoS);
                      setKey(option.value as AnimationKey);
                    }
                  }}
                  // @ts-expect-error react-select bindings expect an object as a value
                  value={key}
                  options={allKeys.map(k => ({
                    label: k,
                    value: k,
                  }))}
                  // @ts-expect-error TODO: Shouldn't this be {data: { label }} instead?
                  renderOption={({ label }) => label}
                  renderValue={({ data: { label } }) => label}
                />
              </Box>
            </ScrollArea>
          )}
        />
      )}
    />
  );
};
export default LottieDebugger;
