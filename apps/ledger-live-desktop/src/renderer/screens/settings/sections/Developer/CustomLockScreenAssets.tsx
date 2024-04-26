import React, { useCallback, useState } from "react";
import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import Box from "~/renderer/components/Box";
import { Flex } from "@ledgerhq/react-ui";
import FramedPicture from "~/renderer/components/CustomImage/FramedPicture";
import Animation from "~/renderer/animations";
import Slider from "~/renderer/components/Slider";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import source from "./sampleimage";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getFramedPictureConfig } from "~/renderer/components/CustomImage/framedPictureConfigs";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import DeviceModelPicker from "~/renderer/components/CustomImage/DeviceModelPicker";

const CustomLockScreenAssets = () => {
  const history = useHistory();

  const onBack = useCallback(() => {
    history.push({ pathname: "/settings/developer" });
  }, [history]);

  const [deviceModelId, setDeviceModelId] = useState<CLSSupportedDeviceModelId>(DeviceModelId.stax);

  const [percentage, setPercentage] = useState<number>(0);

  const fixedPercentage = percentage === 99 ? 100 : percentage; // Nb there's a bug in the slider
  return (
    <Box grow shrink p={3}>
      <Button ff="Inter|SemiBold" color="palette.text.shade100" fontSize={12} onClick={onBack}>
        {"<- Back"}
      </Button>
      <Box my={2} ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14}>
        {"Custom lockscreen assets"}
      </Box>
      <Box py={3}>
        <DeviceModelPicker deviceModelId={deviceModelId} onChange={setDeviceModelId} />
      </Box>
      <Box horizontal>
        <Flex mr={3}>
          <FramedPicture
            frameConfig={getFramedPictureConfig("transfer", deviceModelId)}
            source={source}
            loadingProgress={0}
            background={
              <Animation
                animation={getDeviceAnimation(DeviceModelId.stax, "light", "allowManager")}
              />
            }
          />
        </Flex>
        <Flex mr={3}>
          <FramedPicture
            frameConfig={getFramedPictureConfig("transfer", deviceModelId)}
            source={source}
            loadingProgress={1}
            background={
              <Animation
                animation={getDeviceAnimation(DeviceModelId.stax, "light", "confirmLockscreen")}
              />
            }
          />
        </Flex>
        <FramedPicture
          frameConfig={getFramedPictureConfig("transfer", deviceModelId)}
          source={source}
          loadingProgress={+(fixedPercentage / 100).toFixed(2)}
        />
      </Box>
      <Slider
        value={percentage}
        onChange={(number: React.SetStateAction<number>) => {
          setPercentage(number);
        }}
        steps={100}
        error={undefined}
      />
      {/* Murdered the scaling concept until it's done to all lotties, sorry. */}
      {/* <Box horizontal>
        <Button onClick={() => setScale(0.8)}>{"x0.8"}</Button>
        <Button onClick={() => setScale(1)}>{"x1"}</Button>
        <Button onClick={() => setScale(2)}>{"x2"}</Button>
      </Box> */}
    </Box>
  );
};

export default CustomLockScreenAssets;
