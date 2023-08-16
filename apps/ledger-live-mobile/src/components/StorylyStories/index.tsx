import { Box, Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { isEqual } from "lodash";
import { Linking } from "react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, Layout } from "react-native-reanimated";
import { Storyly } from "storyly-react-native";
import styled from "styled-components/native";
import StoryGroupItem from "./StoryGroupItem";
import StorylyLocalizedWrapper, { Props as StorylyWrapperProps } from "./StorylyWrapper";

type Props = StorylyWrapperProps & {
  /**
   * Controls whether the "seen" state of the story groups affects the order in
   * which they are displayed.
   *
   * true: the stories will always stay in the same order.
   * false: the unseen stories will appear first (default behavior).
   *
   * Default is false.
   */
  keepOriginalOrder?: boolean;
  /**
   * Layout direction: if `vertical` is true stories will be displayed in a
   * column, else they will be displayed in a row (in a horizontal scroll view).
   */
  vertical?: boolean;
  /**
   * Style applied to the horizontal scroll view (only for `vertical={false}`)
   * container.
   */
  horizontalScrollContentContainerStyle?: StyleProp<ViewStyle>;
};

type StoryGroupInfo = {
  id?: string;
  title: string;
  index: number;
  seen: boolean;
  iconUrl?: string;
  stories: { seen: boolean; id?: string }[];
};

const placeholderContent: StoryGroupInfo[] = new Array(5).fill({
  id: undefined,
  title: "",
  index: 0,
  seen: true,
  stories: [{ seen: true, id: undefined }],
});

type StoryGroupItemWrapperProps = {
  vertical: boolean;
  isLast: boolean;
};

const AnimatedStoryGroupWrapper = Animated.createAnimatedComponent<
  FlexBoxProps & StoryGroupItemWrapperProps
>(
  styled(Flex).attrs<StoryGroupItemWrapperProps>(p => ({
    mr: p.isLast || p.vertical ? 0 : 5,
    mb: p.isLast || !p.vertical ? 0 : 16,
  }))``,
);

const defaultScrollContainerStyle: StyleProp<ViewStyle> = {
  justifyContent: "center",
  flexGrow: 1,
};

const updateStoryGroupSeen = (storyGroupList: Storyly.StoryGroup) =>
  storyGroupList.stories.every(story => story.seen)
    ? { ...storyGroupList, seen: true }
    : storyGroupList;

const computeNewStoryGroupList = (storyGroupList: StoryGroupInfo[], event: Storyly.StoryEvent) =>
  storyGroupList.map(group =>
    group.id === event.storyGroup?.id && event.storyGroup
      ? updateStoryGroupSeen(event.storyGroup)
      : group,
  );

/**
 * This component wraps around the Storyly component to allow us to do a fully
 * custom rendering of story groups.
 * */
const Stories: React.FC<Props> = props => {
  const {
    keepOriginalOrder = false,
    vertical = false,
    horizontalScrollContentContainerStyle = defaultScrollContainerStyle,
  } = props;

  const storylyRef = useRef<Storyly>(null);
  const [storyGroupList, setStoryGroupList] = useState<StoryGroupInfo[]>(placeholderContent);

  const handleFail = useCallback(() => {
    setStoryGroupList(placeholderContent);
  }, [setStoryGroupList]);

  const handleLoad = useCallback(
    (event: Storyly.StoryLoadEvent) => {
      if (!isEqual(storyGroupList, event.storyGroupList)) setStoryGroupList(event.storyGroupList);
    },
    [storyGroupList, setStoryGroupList],
  );

  const handleStoryGroupPressed = useCallback((storyGroupId?: string, storyId?: string) => {
    if (!storyGroupId || !storyId) return;
    storylyRef.current?.openStoryWithId(storyGroupId, storyId);
  }, []);

  const handleEvent = useCallback(
    (event: Storyly.StoryEvent) => {
      if (["StoryGroupClosed", "StoryGroupCompleted"].includes(event.event)) {
        const newStoryGroupList = computeNewStoryGroupList(storyGroupList, event);
        if (!isEqual(storyGroupList, newStoryGroupList)) setStoryGroupList(newStoryGroupList);
      }
      if (event.event === "StoryCTAClicked" && event?.story?.media?.actionUrl) {
        Linking.openURL(event.story.media.actionUrl);
        storylyRef.current?.close?.();
      }
    },
    [storyGroupList],
  );

  const renderedStoryGroups = useMemo(
    () =>
      storyGroupList
        .sort((a, b) => (keepOriginalOrder ? a.index - b.index : 1)) // storyly reorders the array by default
        .map((storyGroup, index, arr) => {
          const nextStoryToShowId =
            storyGroup.stories?.find(story => !story.seen)?.id ?? storyGroup.stories[0]?.id;
          return (
            <AnimatedStoryGroupWrapper
              key={storyGroup.id ?? index}
              layout={Layout.easing(Easing.inOut(Easing.quad)).duration(300)}
              isLast={index === arr.length - 1}
              vertical={vertical}
            >
              <StoryGroupItem
                {...storyGroup}
                titlePosition={vertical ? "right" : "bottom"}
                onPress={() => handleStoryGroupPressed(storyGroup.id, nextStoryToShowId)}
              />
            </AnimatedStoryGroupWrapper>
          );
        }),
    [storyGroupList, keepOriginalOrder, vertical, handleStoryGroupPressed],
  );

  return (
    <Flex flexDirection="column" flex={1} alignSelf="stretch">
      {vertical ? (
        <Flex alignSelf="stretch" flex={1}>
          {renderedStoryGroups}
        </Flex>
      ) : (
        <ScrollView
          contentContainerStyle={horizontalScrollContentContainerStyle}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          horizontal
        >
          {renderedStoryGroups}
        </ScrollView>
      )}
      <Box height={0} opacity={0}>
        <StorylyLocalizedWrapper
          ref={storylyRef}
          {...props}
          onEvent={handleEvent}
          onFail={handleFail}
          onLoad={handleLoad}
        />
      </Box>
    </Flex>
  );
};

export default Stories;
