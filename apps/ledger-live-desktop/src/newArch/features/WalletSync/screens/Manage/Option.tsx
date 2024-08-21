import { Flex, Box, Icons, Text } from "@ledgerhq/react-ui";
import React from "react";
import styled, { useTheme } from "styled-components";

export type OptionProps = {
  label: string;
  description: string;
  onClick?: () => void;
  testId: string;
  disabled?: boolean;
};

const OptionContainer = styled(Flex)<{ disabled?: boolean }>`
  &:hover {
    cursor: ${p => (p.disabled ? "not-allowed" : "pointer")};
  }
  opacity: ${p => (p.disabled ? 0.3 : 1)};
`;

export const Separator = () => {
  const { colors } = useTheme();
  return <Box height="1px" width="100%" backgroundColor={colors.opacityDefault.c05} />;
};

export const Option = ({ label, description, onClick, testId, disabled = false }: OptionProps) => (
  <OptionContainer
    onClick={disabled ? undefined : onClick}
    data-testid={testId}
    disabled={disabled}
    flexDirection="column"
  >
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
