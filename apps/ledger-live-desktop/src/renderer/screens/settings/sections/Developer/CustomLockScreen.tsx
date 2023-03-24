import React, { useCallback, useState } from "react";

import Button from "~/renderer/components/Button";
import { useHistory } from "react-router-dom";
import Box from "~/renderer/components/Box";
import { Flex } from "@ledgerhq/react-ui";

import FramedImage from "~/renderer/components/CustomImage/FramedImage";
import Animation from "~/renderer/animations";
import Slider from "~/renderer/components/Slider";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import source from "./sampleimage";

const CustomLockScreen = () => {
  const history = useHistory();

  const onBack = useCallback(() => {
    history.push({ pathname: "/settings/developer" });
  }, [history]);

  const [percentage, setPercentage] = useState<number>(0);
  const [scale, setScale] = useState<number>(0);

  const fixedPercentage = percentage === 99 ? 100 : percentage; // Nb there's a bug in the slider
  return (
    <Box grow shrink p={3}>
      <Button ff="Inter|SemiBold" color="palette.text.shade100" fontSize={12} onClick={onBack}>
        {"<- Back"}
      </Button>
      <Box my={2} ff="Inter|SemiBold" color="palette.text.shade100" fontSize={14}>
        {"Custom lockscreen assets"}
      </Box>
      <Box horizontal>
        <Flex mr={3}>
          <FramedImage
            source={source}
            loadingProgress={0}
            scale={scale}
            background={
              <Animation animation={getDeviceAnimation("stax", "light", "allowManager", true)} />
            }
          />
        </Flex>
        <Flex mr={3}>
          <FramedImage
            source={source}
            loadingProgress={1}
            scale={scale}
            background={
              <Animation
                animation={getDeviceAnimation("stax", "light", "confirmLockscreen", true)}
              />
            }
          />
        </Flex>
        <FramedImage
          source={source}
          loadingProgress={+(fixedPercentage / 100).toFixed(2)}
          scale={scale}
        />
      </Box>
      <Slider
        value={percentage}
        onChange={(number: React.SetStateAction<number>) => {
          setPercentage(number);
        }}
        steps={100}
      />
      <Box horizontal>
        <Button onClick={() => setScale(1)}>{"x1"}</Button>
        <Button onClick={() => setScale(1.5)}>{"x1.5"}</Button>
        <Button onClick={() => setScale(2)}>{"x2"}</Button>
      </Box>
    </Box>
  );
};

export default CustomLockScreen;
