import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { StorylyStyleProps, useStorylyDefaultStyleProps } from "./style";
import { StorylyRef, StorylyData } from "storyly-web";

/**
 * Hook to use Storyly
 *
 * @remarks
 *
 * @param instanceId
 *
 * @returns a ref to be used to manage the Storyly's instance associated with it.
 */
export const useStoryly = (
  instanceId: StorylyInstanceID,
  options?: { styleProps: StorylyStyleProps },
) => {
  const ref = useRef<StorylyRef>();
  const dataRef = useRef<StorylyData>();
  const props = useStorylyDefaultStyleProps();
  const language = useSelector(languageSelector);

  const storyly = useFeature("storyly");

  useLayoutEffect(() => {
    if (!storyly) return;
    console.log(
      "initializing storyly",
      instanceId,
      storyly.params?.stories[instanceId].token,
      language,
      props,
    );
    ref.current?.init({
      layout: "classic",
      token: storyly.params?.stories[instanceId].token || "",
      lang: language,
      segments: [`lang_${language}`],
      events: {
        isReady: data => {
          console.log("storyly isReady", data);
          dataRef.current = data;
          // Triggered when story is ready.
        },
      },
      props: { ...props, ...options?.styleProps },
    });
  });

  /**
   * Change `lang` and `segments` based on the app language
   */
  useLayoutEffect(() => {
    ref.current?.setLang({ language: language });
    ref.current?.setSegments([`lang_${language}`]);
  }, [language]);

  return { ref, dataRef };
};
