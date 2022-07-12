import { Button, Flex } from "@ledgerhq/native-ui";
import { isEqual } from "lodash";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { PixelRatio, Platform, StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  SlideOutLeft,
} from "react-native-reanimated";
import { Storyly } from "storyly-react-native";
import styled from "styled-components/native";
import StoryGroup from "./StoryGroup";
import StorylyWrapper, { Props as StorylyWrapperProps } from "./StorylyWrapper";

type Props = StorylyWrapperProps & {
  style?: StyleProp<ViewStyle>;
  scrollContainerStyle: StyleProp<ViewStyle>;
  /**
   * Controls whether the "state" state of the story groups affects the order in
   * which they are displayed.
   *
   * true: the stories will always stay in the same order.
   * false: the unseen stories will appear first (default behavior).
   *
   * Default is false.
   */
  keepOriginalOrder?: boolean;
};

type StoryGroupInfo = {
  id?: string;
  title: string;
  index: number;
  seen: boolean;
  iconUrl?: string;
  stories: StoryInfo[];
};

const PlaceholderStoryGroup: StoryGroupInfo = {
  id: undefined,
  title: "",
  index: 0,
  seen: true,
  stories: [{ seen: true, id: undefined }],
};

const PlaceholderContent: StoryGroupInfo[] = new Array(5).fill(
  PlaceholderStoryGroup,
);

type StoryInfo = { seen: boolean; id?: string };

const ScrollView = styled.ScrollView.attrs({ horizontal: true })`
  flex: 1;
`;

const AnimatedStoryGroupWrapper = Animated.createAnimatedComponent(
  styled(Flex).attrs((p: { isLast: boolean }) => ({
    mr: p.isLast ? 0 : "14px",
  }))``,
);

const StoryBar: React.FC<Props> = props => {
  const { keepOriginalOrder = false, style } = props;

  const storylyRef = useRef<Storyly>(null);
  const [storyGroupList, setStoryGroupList] = useState<StoryGroupInfo[]>(
    PlaceholderContent,
  );

  const [refreshingStorylyState, setRefreshingStorylyState] = useState<boolean>(
    false,
  );

  const handleFail = useCallback(() => {
    setStoryGroupList(PlaceholderContent);
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
      if (["StoryGroupClosed", "StoryGroupCompleted"].includes(event.event)) {
        /** These are all the events that can be triggered when the full screen
         * story view exits.
         * The only way to get fresh data about the state of the stories is to
         * mount a new Storyly component that will trigger a call of onLoad with
         * up to date data (which story groups is "seen", their order etc.)
         */
        setRefreshingStorylyState(true);
      }
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
              key={storyGroup.id}
              layout={Layout.easing(Easing.inOut(Easing.quad)).duration(300)}
              isLast={index === arr.length}
            >
              <StoryGroup
                {...storyGroup}
                onPress={() =>
                  handleStoryGroupPressed(storyGroup.id, nextStoryToShowId)
                }
              />
            </AnimatedStoryGroupWrapper>
          );
        }),
    [storyGroupList, handleStoryGroupPressed, keepOriginalOrder],
  );

  return (
    <Flex flexDirection="column" flex={1} style={style}>
      <ScrollView contentContainerStyle={props.scrollContainerStyle}>
        {renderedStoryGroups}
      </ScrollView>
      <Flex height={0} opacity={0}>
        <StorylyWrapper
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
          <StorylyWrapper {...props} onLoad={handleLoad} />
        )}
      </Flex>
    </Flex>
  );
};

export default StoryBar;
