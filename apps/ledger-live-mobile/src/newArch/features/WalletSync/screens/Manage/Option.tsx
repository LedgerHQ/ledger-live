import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Separator } from "../../components/Separator";

export type OptionProps = {
  label: string;
  description: string;
  onClick?: () => void;
  testId: string;
};

export const Option = ({ label, description, onClick, testId }: OptionProps) => (
  <TouchableOpacity onPress={onClick} data-testid={testId}>
    <Flex flexDirection="row" alignItems="center" justifyContent="center">
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
    </Flex>

    <Separator />
  </TouchableOpacity>
);
