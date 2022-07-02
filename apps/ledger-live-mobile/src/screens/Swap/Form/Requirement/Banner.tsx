import React from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";

interface Props {
  title: string;
  message: string;
  onPress: () => void;
}

export function Banner({ message, title, onPress }: Props) {
  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={4}
      marginY={4}
      border={1}
      borderRadius={4}
      backgroundColor="primary.c10"
    >
      <Text color="primary.c70">{message}</Text>

      <Button type="main" size="small" onPress={onPress}>
        {title}
      </Button>
    </Flex>
  );
}
