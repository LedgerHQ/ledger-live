import React, { memo, ReactNode, useEffect } from "react";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { Account } from "@ledgerhq/types-live";
import AccountItem from "../AccountItem";
import useItemAnimation from "./useItemAnimation";
import { AccountLikeEnhanced } from "LLM/features/Accounts/screens/ScanDeviceAccounts/types";

type AnimatedAccountItemProps = {
  item: AccountLikeEnhanced;
  index?: number;
  children?: ReactNode;
  onPress: () => void;
};

const AnimatedAccountItem = ({ item, index = 0, children, onPress }: AnimatedAccountItemProps) => {
  const { space } = useTheme();
  const { animatedStyle, startAnimation } = useItemAnimation(index);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }: { pressed: boolean }) => [{ opacity: pressed ? 0.5 : 1.0 }]}
      >
        <Flex
          flexDirection="row"
          alignItems="center"
          borderRadius={space[4]}
          padding={space[6]}
          backgroundColor="opacityDefault.c05"
          width="100%"
        >
          <AccountItem account={item as Account} balance={item.balance} />
          {children}
        </Flex>
      </Pressable>
    </Animated.View>
  );
};

export default memo(AnimatedAccountItem);
