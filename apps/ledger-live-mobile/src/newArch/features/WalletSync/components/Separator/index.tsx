import { Box } from "@ledgerhq/native-ui";
import React from "react";
import { useTheme } from "styled-components/native";

export const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};
