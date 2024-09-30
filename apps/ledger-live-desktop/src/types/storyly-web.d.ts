declare module "storyly-web" {
  type Story = {
    group_id: number;
    id: number;
    index: number;
    actionUrl: string | undefined;
    seen: boolean;
    title: string;
  };

  type StoryGroup = {
    iconUrl: string;
    id: number;
    nudge?: string;
    pinned?: boolean;
    stories: Story[];
    title: string;
    type: unknown;
  };

  type StorylyData = {
    dataSource: string;
    groupList: StoryGroup[];
  };

  /**
   * Storyly Options
   */
  interface StorylyOptions {
    layout: "classic" | "modern";
    token: string;
    locale?: LanguagePrefixed;
    segments?: string[];
    props?: StorylyStyleProps;
  }

  /**
   * Storyly user events
   */
  type StorylyUserEvents =
    | "actionClicked"
    | "loaded"
    | "loadFailed"
    | "openStoryGroup"
    | "storyOpenFailed"
    | "storyImpression"
    | "storyCompleted"
    | "groupCompleted"
    | "closeStoryGroup";

  /**
   * Storyly Ref
   */
  interface StorylyRef {
    init: (options: StorylyOptions) => void;
    setSegments: (options: StorylyOptions["segments"]) => void;
    setLang: (options: { language: StorylyOptions["lang"] }) => void;
    openStory: (props: openStoryParams) => void;
    close: () => void;
    on: (event: StorylyUserEvents, callback: (...args) => void) => void;
  }

  interface openStoryParams {
    group?: string;
    story?: string;
    playMode?: string;
  }

  interface StorylyWebProps<T = StorylyRef> {
    ref?: React.LegacyRef<T> | React.RefObject<T>;
  }

  interface StorylyWebProps {
    // Omitting the `ref` prop here
  }

  // Use the existing "storyly-web" component directly
  const StorylyWeb: React.ForwardRefExoticComponent<
    StorylyWebProps & React.RefAttributes<StorylyRef>
  >;

  export default StorylyWeb;
  export {
    StorylyRef,
    StorylyOptions,
    StorylyData,
    openStoryParams,
    StorylyUserEvents,
    Story,
    StoryGroup,
  };
}
