import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Language } from "~/config/languages";
import { languageSelector } from "~/renderer/reducers/settings";
import { StorylyStyleProps, useStorylyDefaultStyleProps } from "./style";

/**
 * Storyly Options
 */
type StorylyOptions = {
  layout: "classic" | "modern";

  token: string;

  // Internationalization
  lang?: Language;
  segments: string[];

  // Styles
  props?: StorylyStyleProps;
};

/**
 * Storyly Ref
 */
type StorylyRef = {
  init: (options: StorylyOptions) => void;
  setSegments: (options: StorylyOptions["segments"]) => void;
  setLang: (options: { language: StorylyOptions["lang"] }) => void;
};

/**
 * Hook to use Storyly
 *
 * @remarks
 *
 * @param instanceId
 *
 * @returns a ref to be used to manage the Storyly's instance associated with it.
 */
export const useStoryly = (instanceId: StorylyInstanceID) => {
  const ref = useRef<StorylyRef>();
  const props = useStorylyDefaultStyleProps();
  const language = useSelector(languageSelector);

  const storyly = useFeature("storyly");

  useLayoutEffect(() => {
    if (!storyly) return;
    ref.current?.init({
      layout: "classic",
      //
      token: storyly.params?.stories[instanceId].token || "",
      //
      lang: language,
      segments: [`lang_${language}`],
      //
      props,
    });
  });

  /**
   * Change `lang` and `segments` based on the app language
   */
  useLayoutEffect(() => {
    ref.current?.setLang({ language: language });
    ref.current?.setSegments([`lang_${language}`]);
  }, [language]);

  return { ref };
};
