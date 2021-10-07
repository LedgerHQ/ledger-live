import React, { memo } from "react";
import Text from "@ui/components/asorted/Text";
import Flex from "@ui/components/layout/Flex";

type TextProps = React.ComponentProps<typeof Text>;
export type Props = React.PropsWithChildren<Omit<TextProps, "bracket">>;

function Log(props: Props): JSX.Element {
  return (
    <Text
      as="div"
      {...props}
      bracket
      style={{ display: "flex" }}
      ff="Alpha|Medium"
      fontSize="20px"
      textTransform="uppercase"
    >
      <Flex flex={1} justifyContent="center">
        {props.children}
      </Flex>
    </Text>
  );
}

export default memo(Log);
