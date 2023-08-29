import { StorylyInstanceID } from "@ledgerhq/types-live";
import React from "react";
import { useStoryly } from "../useStorily";

/**
 * Storyly Base Component's props.
 */
type StorilyBaseProps = {
  instanceId: StorylyInstanceID;
};

/**
 * Base Component for Storily.
 *
 * @param instanceId
 *
 * @example
 * <StorilyBase instanceId=StorylyInstanceID.testStory />
 */
const StorilyBase = ({ instanceId }: StorilyBaseProps) => {
  const { ref } = useStoryly(instanceId);

  return (
    <>
      {/* @ts-expect-error the `storyly-web` package doesn't provide any typings yet. */}
      <storyly-web ref={ref} />
    </>
  );
};

export default StorilyBase;
