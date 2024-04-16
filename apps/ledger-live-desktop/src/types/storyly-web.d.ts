declare module "storyly-web" {
  interface StorylyOptions {
    layout: string;
    token: string;
    events: {
      closeStoryGroup: () => void;
    };
  }

  interface StorylyRef {
    init: (options: StorylyOptions) => void;
    openStory: (props: openStoryParams) => void;
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
  export { StorylyRef, StorylyOptions, openStoryParams };
}
