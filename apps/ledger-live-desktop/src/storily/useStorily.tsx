import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useLayoutEffect, useRef } from "react";
import { StorylyStyleProps, useStorylyDefaultStyleProps } from "./style";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { Language } from "~/config/languages";

type StorylyOptions = {
  token: string;

  // Internationalization
  lang?: Language;
  segments: string[];

  // Styles
  props?: StorylyStyleProps;
};

type StorylyRef = {
  init: (options: StorylyOptions) => void;
};

export const useStoryly = (instanceId: StorylyInstanceID) => {
  const ref = useRef<StorylyRef>();
  const props = useStorylyDefaultStyleProps();
  const language = useSelector(languageSelector);

  const {
    params: { stories },
  } = useFeature("storyly") || {};

  useLayoutEffect(() => {
    ref.current?.init({
      token: stories[instanceId].token,
      //
      lang: language,
      segments: [`lang_${language}`],
      //
      props,
    });
  }, [instanceId, language, props, stories]);

  return { ref };
};
