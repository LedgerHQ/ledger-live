import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { StorylyInstanceID } from "@ledgerhq/types-live";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { languageSelector } from "~/renderer/reducers/settings";
import { useTheme } from "styled-components";

type Props = {
  instanceID: StorylyInstanceID;
  storylySegments?: string[];
};

type StorylyBaseProps = {
  token: string;
  segments?: string[];
  noStoryGroupLoaded: () => void;
};

const StorylyBase: React.FC<StorylyBaseProps> = ({ token, segments, noStoryGroupLoaded }) => {
  const storylyRef = useRef<"storyly-web">();
  const theme = useTheme();

  useLayoutEffect(() => {
    token &&
      storylyRef.current &&
      storylyRef.current.init({
        token,
        layout: "classic",
        segments,
        events: {
          noStoryGroup: noStoryGroupLoaded,
        },
        /**
         * You can customize Storyly web, here is the documentation
         * https://integration.storyly.io/web/ui-customizations.html#story-group-text-color
         */
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
    // we want to call init only once
    // eslint-disable-next-line
  }, []);

  return <storyly-web ref={storylyRef} />;
};

/**
 * Wrapper around the Storyly component that handles displaying only stories
 * that match the app language, if there are stories for that language.
 * This should always be used in favor of using directly the Storyly component.
 */
export const StorylyWrapper: React.FC<Props> = ({ instanceID, storylySegments }: Props) => {
  const language = useSelector(languageSelector);

  const [segments, setSegments] = useState<string[]>([]);

  const {
    params: { stories },
  } = useFeature("storyly") || {};
  const storyConfig = stories[instanceID] || {};
  const token = storyConfig.token;

  useEffect(() => {
    setSegments([`lang_${language}`, ...(storylySegments ?? [])]);
  }, [language, storylySegments]);

  const handleNoStoryGroupLoaded = useCallback(() => {
    setSegments([`lang_en`, ...(storylySegments ?? [])]);
  }, [storylySegments]);

  /** to remount StorylyBase if the segments or token are different */
  const key = segments?.join(",") + token;

  if (!segments || !token) return null;
  return (
    <div key={key}>
      <StorylyBase
        segments={segments}
        token={token}
        noStoryGroupLoaded={handleNoStoryGroupLoaded}
      />
    </div>
  );
};
