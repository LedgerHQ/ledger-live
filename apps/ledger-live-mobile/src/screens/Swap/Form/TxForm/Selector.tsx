import React from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";

interface Props {
  Icon: React.ReactNode;
  title: string;
  subTitle: string;
  onPress: () => void;
}

export function Selector({ Icon, title, subTitle, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingY={4}
      >
        <Flex flexDirection="row" alignItems="center">
          <Flex>{Icon}</Flex>

          <Flex marginLeft={4} marginRight={4}>
            <Text variant="h3" marginBottom={2}>
              {title}
            </Text>
            <Text variant="subtitle">{subTitle}</Text>
          </Flex>
        </Flex>

        <Icons.ChevronBottomRegular />
      </Flex>
    </TouchableOpacity>
  );
}
