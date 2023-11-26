import { StorylyInstanceID } from "@ledgerhq/types-live";
import React from "react";
import { useStoryly } from "../useStoryly";

/**
 * Storyly Base Component's props.
 */
type StorylyBaseProps = {
  instanceId: StorylyInstanceID;
};

/**
 * Base Component for Storyly.
 *
 * @param instanceId
 *
 * @example
 * <StorylyBase instanceId=StorylyInstanceID.testStory />
 */
const StorylyBase = ({ instanceId }: StorylyBaseProps) => {
  const { ref } = useStoryly(instanceId);

  return (
    <>
      {/* @ts-expect-error the `storyly-web` package doesn't provide any typings yet. */}
      <storyly-web ref={ref} />
    </>
  );
};

export default StorylyBase;
