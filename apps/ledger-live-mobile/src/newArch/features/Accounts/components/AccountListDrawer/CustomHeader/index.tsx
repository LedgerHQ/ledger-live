import React from "react";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";

type Props = {
  onClose: () => void;
  backgroundColor: string;
  iconColor: string;
  title: string;
};

const CustomHeader = ({ onClose, backgroundColor, iconColor, title }: Props) => {
  return (
    <Flex
      flexDirection="row"
      width="100%"
      p={16}
      borderBottom={5}
      borderBottomColor={"neutral.c30"}
      justifyContent="space-between"
      alignItems="center"
    >
      <Text fontSize="18px" fontWeight="semiBold" textTransform="none">
        {title}
      </Text>
      <Flex alignItems="flex-end">
        <TouchableOpacity onPress={onClose}>
          <Flex
            justifyContent="center"
            alignItems="center"
            p={3}
            borderRadius={32}
            backgroundColor={backgroundColor}
          >
            <Icons.Close size="XS" color={iconColor} />
          </Flex>
        </TouchableOpacity>
      </Flex>
    </Flex>
  );
};

export default CustomHeader;
