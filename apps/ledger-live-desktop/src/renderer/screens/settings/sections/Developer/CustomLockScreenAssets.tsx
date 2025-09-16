import React, { useCallback, useState } from "react";
import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import Box from "~/renderer/components/Box";
import { Flex, Theme, Text, Icons } from "@ledgerhq/react-ui";
import FramedPicture from "~/renderer/components/CustomImage/FramedPicture";
import Animation from "~/renderer/animations";
import Slider from "~/renderer/components/Slider";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import source from "./sampleimage";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { CLSSupportedDeviceModelId } from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import DeviceModelPicker from "~/renderer/components/CustomImage/DeviceModelPicker";
import useTheme from "~/renderer/hooks/useTheme";
import { AnimationWrapper } from "~/renderer/components/DeviceAction/rendering";

const CustomLockScreenAssets = () => {
  const history = useHistory();
  const type: Theme["theme"] = useTheme().colors.palette.type;

  const onBack = useCallback(() => {
    history.push({ pathname: "/settings/developer" });
  }, [history]);

  const [deviceModelId, setDeviceModelId] = useState<CLSSupportedDeviceModelId>(DeviceModelId.stax);

  const [percentage, setPercentage] = useState<number>(0);

  const fixedPercentage = percentage === 99 ? 100 : percentage; // Nb there's a bug in the slider
  return (
    <Box grow shrink p={3}>
      <Flex justifyContent="space-between" alignItems="center" margin={4}>
        <Button color="palette.text.shade100" fontSize={12} onClick={onBack} variant="tertiary">
          <Icons.ArrowLeft size="S" style={{ marginRight: 8 }} />
          {"Back"}
        </Button>
        <Text
          variant="h2Inter"
          color="palette.text.shade100"
          margin={"0 auto"}
          fontSize={24}
          pr={50}
        >
          {"Custom lockscreen assets"}
        </Text>
      </Flex>
      <Box py={3}>
        <DeviceModelPicker deviceModelId={deviceModelId} onChange={setDeviceModelId} />
      </Box>
      <Box horizontal alignItems="center" justifyContent="space-between" p={5} height={400}>
        <AnimationWrapper>
          <Animation animation={getDeviceAnimation(deviceModelId, type, "allowManager")} />
        </AnimationWrapper>
        <FramedPicture
          deviceModelId={deviceModelId}
          source={source}
          loadingProgress={+(fixedPercentage / 100).toFixed(2)}
        />
        <AnimationWrapper>
          <FramedPicture deviceModelId={deviceModelId} source={source} showConfirmationButton />
        </AnimationWrapper>
      </Box>
      <Box py={3} width={500} alignSelf={"center"}>
        <Slider
          value={percentage}
          onChange={(number: React.SetStateAction<number>) => {
            setPercentage(number);
          }}
          steps={100}
          error={undefined}
        />
      </Box>
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
