import React, { ForwardedRef, forwardRef, useCallback, useMemo, useState } from "react";
import { Storyly } from "storyly-react-native";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { useSettings } from "~/hooks";

export type Props = {
  instanceID: StorylyInstanceID;
  /**
   * If there are no story groups loaded, it will fallback to loading the
   * english version.
   *
   * Default is true.
   */
  shouldFallbackToEnglishIfEmpty?: boolean;
} & Omit<Storyly.Props, "storylyId">;

/**
 * Wrapper around the Storyly component that handles displaying only stories
 * that match the app language, if there are stories for that language.
 * This should always be used in favor of using directly the Storyly component.
 */
const StorylyLocalizedWrapper = forwardRef((props: Props, ref: ForwardedRef<Storyly>) => {
  const { instanceID, storylySegments, onLoad, shouldFallbackToEnglishIfEmpty = true } = props;

  const [fallbackToEnglish, setFallbackToEnglish] = useState(false);

  const {
    // @ts-expect-error TYPINGS
    params: { stories },
  } = useFeature("storyly") || {};
  const { language } = useSettings();
  const storyConfig = stories[instanceID] || {};
  const storylyInstanceId = storyConfig.token;

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
      onLoad && onLoad(event);
    },
    [onLoad, shouldFallbackToEnglishIfEmpty, setFallbackToEnglish],
  );

  return (
    <Storyly
      ref={ref}
      key={storylyInstanceId + segments.toString()}
      {...props}
      storylyId={storylyInstanceId}
      storylySegments={segments}
      onLoad={handleLoad}
      storylyTestMode={storyConfig.testingEnabled}
      style={{ flex: 1 }} // necessary for touches to work
    />
  );
});

export default StorylyLocalizedWrapper;
