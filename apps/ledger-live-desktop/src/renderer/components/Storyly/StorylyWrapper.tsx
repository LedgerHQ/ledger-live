import React, { useMemo, useLayoutEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { languageSelector } from "~/renderer/reducers/settings";

import { StorylyInstanceID } from "./types";

type Props = {
  instanceID: StorylyInstanceID;
  storylySegments?: string[];
};

export const StorylyWrapper = ({ instanceID, storylySegments }: Props) => {
  const storylyRef = useRef();
  const language = useSelector(languageSelector);

  const segments = useMemo(() => {
    const languageSegments = [language, ...(true && language !== "en" ? ["en"] : [])].map(
      l => `lang_${l}`,
    );
    return [...languageSegments, ...(storylySegments ?? [])];
  }, [language, storylySegments]);

  useLayoutEffect(() => {
    /**
     * You can customize Storyly web, here is the documentation
     * https://integration.storyly.io/web/ui-customizations.html#story-group-text-color
     */
    storylyRef.current.init({
      token: instanceID,
      layout: "classic",
      segments: segments,
      props: {
        storyGroupAlign: "left",
        storyGroupBorderRadius: "35",
        storyGroupTextColor: "#FFFFFF",
        storyGroupTextSeenColor: "#FFFFFF",
        storyGroupIconBorderColorSeen: ["#461AF7", "#FF6E33"],
      },
    });
  }, []);
  return <storyly-web ref={storylyRef} />;
};
