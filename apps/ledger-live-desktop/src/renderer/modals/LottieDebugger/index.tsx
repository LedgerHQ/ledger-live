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
import { getProductName } from "LLD/utils/getProductName";

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
  const [deviceModelId, setDeviceModelId] = useState<DeviceModelId>(DeviceModelId.stax);
  const [animationKey, setAnimationKey] = useState<AnimationKey>("enterPinCode");

  const allKeys = [...keys, ...onBoardingKeys];

  const lightAnimation = useMemo(() => {
    if (keys.includes(animationKey)) {
      // Normal deviceAction animations
      return getDeviceAnimation(deviceModelId, "light", animationKey);
    }
    return null;
    // Onboarding animations
  }, [animationKey, keys, deviceModelId]);

  const darkAnimation = useMemo(() => {
    if (keys.includes(animationKey)) {
      // Normal deviceAction animations
      return getDeviceAnimation(deviceModelId, "dark", animationKey);
    }

    return null;
    // Onboarding animations
  }, [animationKey, keys, deviceModelId]);

  const DeviceSelectButton = ({ modelId }: { modelId: DeviceModelId }) => (
    <Button
      mr={2}
      primary
      onClick={() => {
        setDeviceModelId(modelId);
      }}
    >
      {getProductName(modelId)}
    </Button>
  );

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
              <div>
                {!animationKey
                  ? "Select Animation"
                  : `Showing '${animationKey}' for ${deviceModelId}`}
              </div>
              <AnimationWrapper>
                <Animation animation={lightAnimation} />
              </AnimationWrapper>
              <AnimationWrapper dark>
                <Animation animation={darkAnimation} />
              </AnimationWrapper>
              <Box mt={2} mb={2} horizontal>
                <DeviceSelectButton modelId={DeviceModelId.apex} />
                <DeviceSelectButton modelId={DeviceModelId.europa} />
                <DeviceSelectButton modelId={DeviceModelId.stax} />
                <DeviceSelectButton modelId={DeviceModelId.nanoSP} />
                <DeviceSelectButton modelId={DeviceModelId.nanoX} />
                <DeviceSelectButton modelId={DeviceModelId.nanoS} />
              </Box>
              <Box>
                <Select<{ label: string; value: string }>
                  isSearchable={false}
                  onChange={option => {
                    if (option) {
                      setDeviceModelId(DeviceModelId.stax);
                      setAnimationKey(option.value as AnimationKey);
                    }
                  }}
                  value={{ label: animationKey, value: animationKey }}
                  options={allKeys.map(k => ({
                    label: k,
                    value: k,
                  }))}
                  renderOption={({ data }) => data.label}
                  renderValue={({ data }) => data.label}
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
