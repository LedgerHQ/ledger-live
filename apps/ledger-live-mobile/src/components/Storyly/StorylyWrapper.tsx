import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { Storyly } from "storyly-react-native";
import styled from "styled-components/native";
import { languageSelector } from "../../reducers/settings";
import { StorylyInstanceID } from "./shared"; // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars

export type Props = {
  instanceID: StorylyInstanceID;
  /**
   * Videos not supported on Android for now, causing a crash if they load.
   * As a better-than-nothing safety net, if this props is set to true
   * it will fully disable the current instance in case it's Android and some
   * video content is detected.
   *
   * Default is true.
   */
  shouldBlockVideoContentOnAndroid?: boolean;
  /**
   * If there are no story groups loaded, it will fallback to loading the
   * english version.
   *
   * Default is true.
   */
  shouldFallbackToEnglishIfEmpty?: boolean;
  onFail: (event: String) => void;
} & Omit<Storyly.Props, "storylyId" | "onFail">;

// @ts-ignore idk how to fix this
const StyledStoryly = styled(Storyly)`
  flex: 1; // necessary for touches to work;
`;

const StorylyWrapper = forwardRef(
  (props: Props, ref: ForwardedRef<Storyly>) => {
    const {
      instanceID,
      storylySegments,
      onLoad,
      onFail,
      onEvent,
      shouldBlockVideoContentOnAndroid = true,
      shouldFallbackToEnglishIfEmpty = true,
    } = props;

    const [fallbackToEnglish, setFallbackToEnglish] = useState(false);
    const [
      instanceIdBlocked,
      setInstanceIdBlocked,
    ] = useState<StorylyInstanceID | null>(null);

    const language = useSelector(languageSelector);

    const segments = useMemo(() => {
      const languageSegments = [
        language,
        ...(fallbackToEnglish && language !== "en" ? ["en"] : []),
      ].map(l => `lang_${l}`);
      return [...languageSegments, ...(storylySegments ?? [])];
    }, [language, storylySegments, fallbackToEnglish]);

    const handleLoad = useCallback(
      (event: Storyly.StoryLoadEvent) => {
        if (shouldFallbackToEnglishIfEmpty && event.storyGroupList.length === 0)
          setFallbackToEnglish(true);
        if (shouldBlockVideoContentOnAndroid && Platform.OS === "android") {
          if (
            event.storyGroupList.find(
              storyGroup =>
                !!storyGroup.stories.find(story => story.media.type !== 1),
            )
          ) {
            setInstanceIdBlocked(instanceID);
            onFail && onFail("StorylyWrapper: Video story blocked on Android");
            return;
          }
        }
        onLoad && onLoad(event);
      },
      [
        onFail,
        onLoad,
        shouldFallbackToEnglishIfEmpty,
        setFallbackToEnglish,
        shouldBlockVideoContentOnAndroid,
        setInstanceIdBlocked,
        instanceID,
      ],
    );

    const handleFail = useCallback(
      (event: String) => {
        onFail(event);
      },
      [onFail],
    );

    const handleEvent = useCallback(
      (event: Storyly.StoryEvent) => {
        onEvent && onEvent(event);
      },
      [onEvent],
    );

    return (
      <StyledStoryly
        ref={ref}
        {...props}
        key={segments.toString()}
        storylyId={instanceIdBlocked === instanceID ? "" : instanceID}
        storylySegments={segments}
        onLoad={handleLoad}
        onFail={handleFail}
        onEvent={handleEvent}
      />
    );
  },
);

export default StorylyWrapper;
