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
          <TouchableOpacity onPress={onEdit}>
            <Flex marginLeft={2} width={20} height={20} alignItems="center" justifyContent="center">
              <Icon name="Pen" color="primary.c70" />
            </Flex>
          </TouchableOpacity>
        )}
      </Flex>
    </Flex>
  );
}
