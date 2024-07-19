import React, { ReactNode } from "react";
import { Flex, Divider } from "@ledgerhq/react-ui";
import { useTheme } from "styled-components";

interface FooterProps {
  children: ReactNode;
}

const Footer = ({ children }: FooterProps) => {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="column"
      alignSelf="stretch"
      height={"80px"}
      position="fixed"
      bottom={0}
      backgroundColor={colors.background.main}
      width={"100%"}
    >
      <Divider color={"neutral.c30"} />
      <Flex
        flex={1}
        alignSelf="stretch"
        flexDirection="row"
        justifyContent="space-between"
        alignItems={"center"}
        py={"12px"}
        px={"40px"}
      >
        {children}
      </Flex>
    </Flex>
  );
};

export default Footer;
