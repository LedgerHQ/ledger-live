import { useTheme } from "styled-components";

// https://docs.storyly.io/docs/web-set-up-storyly-bar#story-bar-customizations

/**
 * Storyly Style's props.
 */
export type StorylyStyleProps = {
  storyGroupTextColor?: string;
  storyGroupTextSeenColor?: string;
  storyGroupIconBorderColorNotSeen?: [string, string];
  storyGroupIconBorderColorSeen?: [string, string];
};

/**
 * Hook that handle the Storyly Style's props set up.
 *
 * @returns Storyly Style's props.
 */
export const useStorylyDefaultStyleProps = (): StorylyStyleProps => {
  const theme = useTheme();

  return {
    storyGroupTextColor: theme.colors.neutral.c100,

    storyGroupTextSeenColor: theme.colors.neutral.c100,
    storyGroupIconBorderColorNotSeen: [theme.colors.primary.c80, theme.colors.primary.c80],
    storyGroupIconBorderColorSeen: [theme.colors.primary.c80, theme.colors.primary.c80],
  };
};
