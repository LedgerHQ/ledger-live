import React, { useCallback, useMemo, useState } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { Storyly } from "storyly-react-native";
import { languageSelector } from "../../reducers/settings";
import { StorylyInstanceID } from "./shared"; // eslint-disable-line no-unused-vars, @typescript-eslint/no-unused-vars

type Props = {
  instanceID: StorylyInstanceID;
  shouldBlockVideoContentOnAndroid?: boolean; // videos not supported on Android for now, causing a crash if they load
  shouldFallbackToEnglishIfEmpty?: boolean;
} & Omit<Storyly.Props, "storylyId">;

const StorylyWrapper: React.FC<Props> = props => {
  const {
    instanceID,
    storylySegments,
    onLoad,
    onFail,
    shouldBlockVideoContentOnAndroid = true,
    shouldFallbackToEnglishIfEmpty = true,
  } = props;

  const [fallbackToEnglish, setFallbackToEnglish] = useState(false);
  const [blocked, setBlocked] = useState(false);

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
      console.log("StorylyWrapper handleLoad", event);
      if (shouldFallbackToEnglishIfEmpty && event.storyGroupList.length === 0)
        setFallbackToEnglish(true);
      if (shouldBlockVideoContentOnAndroid && Platform.OS === "android") {
        if (
          event.storyGroupList.find(
            storyGroup =>
              !!storyGroup.stories.find(story => story.media.type !== 1),
          )
        )
          setBlocked(true);
      }
      onLoad && onLoad(event);
    },
    [
      onLoad,
      shouldFallbackToEnglishIfEmpty,
      setFallbackToEnglish,
      shouldBlockVideoContentOnAndroid,
      setBlocked,
    ],
  );

  const handleFail = useCallback(
    (event: String) => {
      console.log("StorylyWrapper handleFail", event);
      onFail && onFail(event);
    },
    [onFail],
  );

  return (
    <Storyly
      {...props}
      storylyId={blocked ? "" : instanceID}
      storylySegments={segments}
      onLoad={handleLoad}
      onFail={handleFail}
    />
  );
};

export default StorylyWrapper;
