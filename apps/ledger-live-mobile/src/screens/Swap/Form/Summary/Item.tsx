import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Icon, Text } from "@ledgerhq/native-ui";

interface RowProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}

export function Item({ title, children, onEdit }: RowProps) {
  return (
    <Flex flexDirection="row" justifyContent="space-between" paddingY={4}>
      <Text color="neutral.c70">{title}</Text>

      <Flex flexDirection="row" alignItems="center">
        {children}

        {onEdit && (
          <Flex paddingLeft={4}>
            <TouchableOpacity onPress={onEdit}>
              <Icon name="Pen" color="primary.c70" />
            </TouchableOpacity>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
