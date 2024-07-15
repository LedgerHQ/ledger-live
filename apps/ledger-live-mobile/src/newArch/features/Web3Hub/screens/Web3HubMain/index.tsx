import React, { useContext } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { BaseComposite } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { Web3HubStackParamList } from "LLM/features/Web3Hub/Navigator";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import ManifestsList from "LLM/features/Web3Hub/components/ManifestsList";

type Props = BaseComposite<NativeStackScreenProps<Web3HubStackParamList, ScreenName.Web3HubMain>>;

export default function Web3HubMain({ navigation }: Props) {
  const { layoutY } = useContext(HeaderContext);

  const scrollHandler = useAnimatedScrollHandler(event => {
    if (!layoutY) return;
    layoutY.value = event.contentOffset.y;
  });

  return (
    <Animated.ScrollView
      style={{
        flex: 1,
      }}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <ManifestsList navigation={navigation} />
    </Animated.ScrollView>
  );
}
