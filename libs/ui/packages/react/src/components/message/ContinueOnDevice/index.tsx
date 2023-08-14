import React from "react";

import { Divider, Text } from "../../asorted";
import Flex from "../../layout/Flex";

type Props = {
  Icon: React.ComponentType<{ size: number; color?: string }>;
  text: string;
  withTopDivider?: boolean;
};

const ContinueOnDevice: React.FC<Props> = ({ Icon, text, withTopDivider = true }) => {
  return (
    <Flex flexDirection="column">
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
