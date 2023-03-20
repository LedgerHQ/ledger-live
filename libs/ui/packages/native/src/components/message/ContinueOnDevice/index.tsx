import React from "react";
import { IconType } from "src/components/Icon/type";
import Divider from "../../Layout/Divider";
import Flex from "../../Layout/Flex";
import Text from "../../Text";

type Props = {
  Icon: IconType;
  text: string;
  withTopDivider?: boolean;
};

const ContinueOnDevice: React.FC<Props> = ({ Icon, text, withTopDivider = true }) => {
  return (
    <Flex>
      {withTopDivider ? <Divider my={6} /> : null}
      <Flex flexDirection="row" alignItems="center" flexShrink={1}>
        <Icon size={48} />
        <Text
          flex={1}
          pl={4}
          flexWrap="wrap"
          variant="body"
          fontWeight="medium"
          color="neutral.c100"
        >
          {text}
        </Text>
      </Flex>
    </Flex>
  );
};

export default ContinueOnDevice;
