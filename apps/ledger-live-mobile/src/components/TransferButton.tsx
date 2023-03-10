import React, { useCallback } from "react";
import { BoxedIcon, Flex, Tag, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity, StyleProp, ViewStyle } from "react-native";
import type { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { ChevronRightMedium } from "@ledgerhq/native-ui/assets/icons";
import { track } from "../analytics";

type Props = {
  title: string;
  description: string;
  tag?: string;
  Icon: IconType;
  onPress?: (() => void) | null;
  disabled?: boolean;
  event?: string;
  eventProperties?: Parameters<typeof track>[1];
  style?: StyleProp<ViewStyle>;
  rightArrow?: boolean;
};

export default function TransferButton({
  title,
  description,
  tag,
  Icon,
  onPress,
  disabled,
  event = "button_clicked",
  eventProperties,
  style,
  rightArrow = false,
}: Props) {
  const handlePress = useCallback(() => {
    if (onPress) onPress();
    if (event) track(event, eventProperties ?? null);
  }, [onPress, event, eventProperties]);

  return (
    <TouchableOpacity disabled={disabled} onPress={handlePress} style={[style]}>
      <Flex flexDirection="row" justifyContent="flex-start" alignItems="center">
        <BoxedIcon
          Icon={Icon}
          variant={"circle"}
          iconColor={disabled ? "neutral.c50" : "neutral.c100"}
          backgroundColor={disabled ? "neutral.c30" : "neutral.c40"}
          borderColor={disabled ? "neutral.c30" : "neutral.c40"}
        />
        <Flex
          flexDirection="column"
          justifyContent="space-between"
          alignItems="flex-start"
          ml="16px"
          py="1px"
          flexShrink={1}
          flexGrow={1}
        >
          <Flex flexDirection="row" alignItems={"center"}>
            <Text
              variant="large"
              fontWeight="semiBold"
              color={disabled ? "neutral.c50" : "neutral.c100"}
            >
              {title}
            </Text>
            {tag && (
              <Tag
                size={"small"}
                type={"color"}
                ml={3}
                opacity={disabled ? 0.3 : 1}
              >
                {tag}
              </Tag>
            )}
          </Flex>
          <Text
            variant="body"
            fontWeight="medium"
            color={disabled ? "neutral.c40" : "neutral.c70"}
            numberOfLines={3}
          >
            {description}
          </Text>
        </Flex>
        {rightArrow && (
          <Flex alignSelf="flex-end">
            <ChevronRightMedium size={18} />
          </Flex>
        )}
      </Flex>
    </TouchableOpacity>
  );
}
