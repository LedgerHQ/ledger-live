import React from "react";
import { IconType } from "src/components/Icon/type";
import { radii } from "../../../styles/theme";
import Flex from "../../Layout/Flex";
import Text from "../../Text";

type Props = {
  Icon: IconType;
  text: string;
};

const ContinueOnDevice: React.FC<Props> = ({ Icon, text }) => {
  return (
    <Flex
      backgroundColor="neutral.c30"
      p={3}
      flexDirection="row"
      alignItems="center"
      borderRadius={radii[2]}
      flexShrink={1}
    >
      <Icon size={48} />
      <Text flex={1} mx={4} flexWrap="wrap" variant="body" fontWeight="medium" color="primary.c80">
        {text}
      </Text>
    </Flex>
  );
};

export default ContinueOnDevice;
