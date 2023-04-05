import { Box, Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { isEqual } from "lodash";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, StyleProp, ViewStyle } from "react-native";
import Animated, { Easing, Layout } from "react-native-reanimated";
import { Storyly } from "storyly-react-native";
import styled from "styled-components/native";
import StoryGroupItem from "./StoryGroupItem";
import StorylyLocalizedWrapper, {
  Props as StorylyWrapperProps,
} from "./StorylyWrapper";

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
  const [storyGroupList, setStoryGroupList] =
    useState<StoryGroupInfo[]>(placeholderContent);

  const [refreshingStorylyState, setRefreshingStorylyState] =
    useState<boolean>(false);

  const handleFail = useCallback(() => {
    setStoryGroupList(placeholderContent);
  }, [setStoryGroupList]);

  const handleLoad = useCallback(
    (event: Storyly.StoryLoadEvent) => {
      setRefreshingStorylyState(false);
      const newStoryGroupList = event.storyGroupList.map(group => ({
        ...group,
        stories: group.stories.map(s => ({ id: s.id, seen: s.seen })),
      }));
      if (!isEqual(storyGroupList, newStoryGroupList))
        setStoryGroupList(newStoryGroupList);
    },
    [storyGroupList, setStoryGroupList, setRefreshingStorylyState],
  );

  const handleStoryGroupPressed = useCallback(
    (storyGroupId?: string, storyId?: string) => {
      if (!storyGroupId || !storyId) return;
      storylyRef?.current?.openStoryWithId(storyGroupId, storyId);
    },
    [storylyRef],
  );

  const handleEvent = useCallback(
    (event: Storyly.StoryEvent) => {
      let timeout: ReturnType<typeof setTimeout>;
      if (["StoryGroupClosed", "StoryGroupCompleted"].includes(event.event)) {
        /** These are all the events that can be triggered when the full screen
         * story view exits.
         * The only way to get fresh data about the state of the stories is to
         * mount a new Storyly component that will trigger a call of onLoad with
         * up to date data (which story groups is "seen", their order etc.)
         */
        timeout = setTimeout(() => setRefreshingStorylyState(true), 1000);
      }
      return () => {
        timeout && clearTimeout(timeout);
      };
    },
    [setRefreshingStorylyState],
  );

  const renderedStoryGroups = useMemo(
    () =>
      storyGroupList
        .sort((a, b) => (keepOriginalOrder ? a.index - b.index : 1)) // storyly reorders the array by default
        .map((storyGroup, index, arr) => {
          const nextStoryToShowId =
            storyGroup.stories?.find(story => !story.seen)?.id ??
            storyGroup.stories[0]?.id;
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
                onPress={() =>
                  handleStoryGroupPressed(storyGroup.id, nextStoryToShowId)
                }
              />
            </AnimatedStoryGroupWrapper>
          );
        }),
    [storyGroupList, handleStoryGroupPressed, keepOriginalOrder, vertical],
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
        {refreshingStorylyState && (
          /**
           * We mount a 2nd StorylyWrapper component in parallel, which is the
           * only way to trigger a "onLoad" with fresh data while keeping the
           * storylyRef usable.
           * cf. handleEvent method for explanation
           */
          <StorylyLocalizedWrapper {...props} onLoad={handleLoad} />
        )}
      </Box>
    </Flex>
  );
};

export default Stories;
