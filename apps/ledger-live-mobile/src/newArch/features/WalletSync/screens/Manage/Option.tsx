import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Separator } from "../../components/Separator";
import styled from "styled-components/native";

export type OptionProps = {
  label: string;
  description: string;
  onClick?: () => void;
  testId: string;
  disabled?: boolean;
  id: string;
};

export const Option = ({ label, description, onClick, testId, disabled }: OptionProps) => (
  <TouchableOpacity onPress={onClick} data-testid={testId} disabled={disabled}>
    <Container flexDirection="row" alignItems="center" justifyContent="center" disabled={disabled}>
      <Flex paddingY={24} width={304}>
        <Text fontWeight="semiBold" variant="large" color="neutral.c100">
          {label}
        </Text>

        <Text variant="bodyLineHeight" color="neutral.c70">
          {description}
        </Text>
      </Flex>

      <Flex flexGrow={1} alignItems={"center"} justifyContent={"end"}>
        <Icons.ChevronRight size="M" color="neutral.c70" />
      </Flex>
    </Container>

    <Separator />
  </TouchableOpacity>
);

const Container = styled(Flex).attrs((p: { disabled?: boolean }) => ({
  opacity: p.disabled ? 0.3 : 1,
}))<{ disabled?: boolean }>``;
