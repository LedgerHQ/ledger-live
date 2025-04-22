import React, { useCallback, memo, useState } from "react";
import styled, { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import RingChart from "./RingChart";
import { useDistribution } from "~/actions/general";
import DistributionCard, { DistributionItem } from "./DistributionCard";
import { TrackScreen } from "~/analytics";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { normalize } from "~/helpers/normalizeSize";
import { ReactNavigationPerformanceView } from "@shopify/react-native-performance-navigation";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";
import { getTextStyle } from "@ledgerhq/native-ui/lib/components/Text/getTextStyle";
import { ScreenName } from "~/const";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import SafeAreaView from "~/components/SafeAreaView";
import { LayoutChangeEvent, View } from "react-native";
import { getEstimatedListSize } from "LLM/utils/getEstimatedListSize";

const AnimatedFlashList =
  Animated.createAnimatedComponent<FlashListProps<DistributionItem>>(FlashList);

const ContentWrapper = styled(Flex).attrs({
  alignItems: "center",
  flex: 1,
})``;

const AssetWrapperContainer = styled(Flex).attrs({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
})``;

const initialSize = normalize(200);
const minSize = normalize(150);
const initialFontSize = 26;
const minFontSize = 18;
const estimatedItemSize = 54;

function Allocation() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const textStyle = getTextStyle({ variant: "h1", fontWeight: "medium" });
  const estimatedListSize = getEstimatedListSize({ itemSize: estimatedItemSize });

  const distribution = useDistribution({ showEmptyAccounts: true });

  const scrollY = useSharedValue(0);

  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const onContentSizeChange = useCallback((width: number, height: number) => {
    setContentHeight(height);
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: DistributionItem }) => <DistributionCard item={item} />,
    [],
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = Math.max(0, event.contentOffset.y);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const startPoint = containerHeight * 0.1;
    const endPoint = containerHeight * 0.3;

    const size = interpolate(
      scrollY.value,
      [startPoint, endPoint],
      [initialSize, minSize],
      "clamp",
    );

    return {
      width: size,
      height: size,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const startPoint = containerHeight * 0.1;
    const endPoint = containerHeight * 0.3;

    const fontSize = interpolate(
      scrollY.value,
      [startPoint, endPoint],
      [initialFontSize, minFontSize],
      "clamp",
    );

    const { lineHeight, ...safeTextStyle } = textStyle;

    return {
      ...safeTextStyle,
      fontSize,
      textStyle,
      color: colors.neutral.c100,
    };
  });

  return (
    <ReactNavigationPerformanceView screenName={ScreenName.AnalyticsAllocation} interactive>
      <SafeAreaView isFlex edges={["bottom", "left", "right"]}>
        <ContentWrapper>
          <Flex alignItems="center" justifyContent="center">
            <Animated.View style={animatedStyle}>
              <RingChart size={animatedStyle.width} data={distribution.list} colors={colors} />
            </Animated.View>
            <AssetWrapperContainer pointerEvents="none">
              <Animated.Text style={[animatedTextStyle]}>{distribution.list.length}</Animated.Text>
              <Animated.Text style={[animatedTextStyle]}>
                {t("distribution.assets", { count: distribution.list.length })}
              </Animated.Text>
            </AssetWrapperContainer>
          </Flex>
          <Flex flex={1} width="100%" onLayout={onLayout}>
            <AnimatedFlashList
              data={distribution.list}
              renderItem={renderItem}
              keyExtractor={item => item.currency.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 32,
              }}
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              estimatedItemSize={estimatedItemSize}
              scrollEnabled={contentHeight > containerHeight}
              onContentSizeChange={onContentSizeChange}
              estimatedListSize={estimatedListSize}
              ItemSeparatorComponent={() => <View style={{ height: 32 }} />}
            />
          </Flex>
        </ContentWrapper>
        <TrackScreen category="Analytics" name="Allocation" />
      </SafeAreaView>
    </ReactNavigationPerformanceView>
  );
}

export default withDiscreetMode(memo(Allocation));
