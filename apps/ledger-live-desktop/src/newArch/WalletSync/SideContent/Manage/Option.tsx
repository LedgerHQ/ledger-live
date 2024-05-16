import { Flex, Box, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled, { useTheme } from "styled-components";

export type OptionProps = {
  label: string;
  description: string;
};

export const OptionContainer = styled.div`
  &:hover {
    cursor: pointer;
  }
`;

export const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

export const Option = ({ label, description }: OptionProps) => (
  <OptionContainer>
    <Flex>
      <Box paddingY={24} width={304}>
        <Box>
          <Text fontSize={13.44} variant="body">
            {label}
          </Text>
        </Box>
        <Text fontSize={13.44} variant="body" color="hsla(0, 0%, 58%, 1)">
          {description}
        </Text>
      </Box>

      <Flex flexGrow={1} alignItems={"center"} justifyContent={"end"}>
        <Icons.ChevronRight size="S" />
      </Flex>
    </Flex>

    <Separator />
  </OptionContainer>
);
