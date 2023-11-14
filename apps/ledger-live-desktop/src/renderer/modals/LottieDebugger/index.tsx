/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import Button from "~/renderer/components/Button";
import Animation from "~/renderer/animations";
import Alert from "~/renderer/components/Alert";
import Box from "~/renderer/components/Box";
import Modal, { ModalBody } from "~/renderer/components/Modal";
import Select from "~/renderer/components/Select";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import { AnimationKey, getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceModelId } from "@ledgerhq/devices";

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

const LottieDebugger = () => {
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

    return null;
    // Onboarding animations
  }, [key, keys, modelId]);
  const animation2 = useMemo(() => {
    if (keys.includes(key)) {
      // Normal deviceAction animations
      return getDeviceAnimation(modelId, "dark", key);
    }

    return null;
    // Onboarding animations
  }, [key, keys, modelId]);
  return (
    <Modal
      name="MODAL_LOTTIE_DEBUGGER"
      centered
      render={({ onClose }) => (
        <ModalBody
          onClose={onClose}
          onBack={undefined}
          title={<Trans i18nKey="settings.experimental.features.testAnimations.title" />}
          noScroll
          render={() => (
            <ScrollArea>
              <Alert type="warning">
                <Trans i18nKey="settings.experimental.features.testAnimations.longDesc" />
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
