import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { IconProps } from "LLD/features/Collectibles/types/Collection";

type Props = {
  icons: (({ size, color, style }: IconProps) => JSX.Element)[];
};

const IconContainer: React.FC<Props> = ({ icons }) => {
  return (
    <Flex
      borderRadius="8px"
      justifyContent="center"
      alignItems="center"
      bg="opacityDefault.c05"
      borderColor="opacityDefault.c10"
      borderWidth="1px"
      borderStyle="solid"
      p="8px"
      columnGap="8px"
    >
      {icons.map((Icon, index) => (
        <Icon key={index} size="XS" color="neutral.c100" />
      ))}
    </Flex>
  );
};

export default IconContainer;
