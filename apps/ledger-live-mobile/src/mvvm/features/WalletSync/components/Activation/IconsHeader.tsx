import React from "react";
import { Icons, Flex } from "@ledgerhq/native-ui";
import IconWrapper from "../IconWrapper";
import { useTheme } from "styled-components/native";

const IconsHeader = () => {
  const { colors } = useTheme();

  return (
    <Flex justifyContent="center" alignItems="center" flexDirection="row">
      <IconWrapper>
        <Icons.Mobile color={colors.constant.purple} />
      </IconWrapper>
      <IconWrapper opacity="1">
        <Icons.Refresh size="L" color={colors.constant.purple} />
      </IconWrapper>
      <IconWrapper>
        <Icons.Desktop color={colors.constant.purple} />
      </IconWrapper>
    </Flex>
  );
};

export default IconsHeader;
