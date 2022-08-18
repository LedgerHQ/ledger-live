import React, { useMemo, useLayoutEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";
import { useTheme } from "styled-components";

import { StorylyInstanceID } from "./types";

type Props = {
  instanceID: StorylyInstanceID;
  storylySegments?: string[];
};

export const StorylyWrapper = ({ instanceID, storylySegments }: Props) => {
  const storylyRef = useRef();
  const language = useSelector(languageSelector);
  const theme = useTheme();

  const segments = useMemo(() => {
    const languageSegments = [
      language,
      ...(((language as unknown) as string) !== "en" ? ["en"] : []),
    ].map(l => `lang_${l}`);
    return [...languageSegments, ...(storylySegments ?? [])];
  }, [language, storylySegments]);

  useLayoutEffect(() => {
    /**
     * You can customize Storyly web, here is the documentation
     * https://integration.storyly.io/web/ui-customizations.html#story-group-text-color
     */
    storylyRef.current &&
      storylyRef.current.init({
        token: instanceID,
        layout: "classic",
        segments: segments,
        props: {
          storyGroupAlign: "left",
          storyGroupBorderRadius: "35",
          /**
           * Story title color for not seen story
           */
          storyGroupTextColor: theme.colors.neutral.c100,
          /**
           * Story title color for already seen story
           */
          storyGroupTextSeenColor: theme.colors.neutral.c100,
          storyGroupIconBorderColorNotSeen: [theme.colors.primary.c80, theme.colors.primary.c80],
          storyGroupIconBorderColorSeen: [theme.colors.primary.c80, theme.colors.primary.c80],
        },
      });
  }, [instanceID, segments, theme.colors]);
  return <storyly-web ref={storylyRef} />;
};
