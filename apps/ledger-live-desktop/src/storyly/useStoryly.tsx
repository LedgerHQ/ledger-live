import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import { useLayoutEffect, useRef, useContext } from "react";
import { useSelector } from "react-redux";
import { closeAllModal } from "~/renderer/actions/modals";
import { context } from "~/renderer/drawers/Provider";
import { useDispatch } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { StorylyStyleProps, useStorylyDefaultStyleProps } from "./style";
import { openURL } from "~/renderer/linking";
import { StorylyRef, StorylyData, Story, StoryGroup } from "storyly-web";

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
  const dispatch = useDispatch();
  const { setDrawer } = useContext(context);
  const ref = useRef<StorylyRef>();
  const dataRef = useRef<StoryGroup[]>();
  const props = useStorylyDefaultStyleProps();
  const language = useSelector(languageSelector);

  const storyly = useFeature("storyly");

  useLayoutEffect(() => {
    if (!storyly) return;
    ref.current?.init({
      layout: "classic",
      token: storyly.params?.stories[instanceId].token || "",
      segments: [`lang_${language}`],
      props: { ...props, ...options?.styleProps },
    });

    ref.current?.on("loaded", (data: StorylyData) => {
      dataRef.current = data.groupList;
    });

    ref.current?.on("actionClicked", (story: Story) => {
      if (!story.actionUrl) return;
      openURL(story.actionUrl);
      ref.current?.close?.();
      dispatch(closeAllModal());
      setDrawer();
    });
  });

  /**
   * Change `lang` and `segments` based on the app language
   */
  useLayoutEffect(() => {
    ref.current?.setLang({ language });
    ref.current?.setSegments([`lang_${language}`]);
  }, [language]);

  return { ref, dataRef };
};
