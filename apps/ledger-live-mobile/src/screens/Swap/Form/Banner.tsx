import React from "react";
import { Flex, Text, Button } from "@ledgerhq/native-ui";

interface Props {
  message: string;
  cta: string;
  onPress: () => void;
}

export function Banner({ message, cta, onPress }: Props) {
  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      padding={4}
      marginY={4}
      borderRadius={4}
      backgroundColor="primary.c10"
    >
      <Flex flex={1}>
        <Text color="primary.c70">{message}</Text>
      </Flex>

      <Button type="main" size="small" onPress={onPress} marginLeft={2} outline>
        {cta}
      </Button>
    </Flex>
  );
}
