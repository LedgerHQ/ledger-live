import { StorylyInstanceID } from "@ledgerhq/types-live";
import React from "react";
import { useStoryly } from "../useStorily";

type StorilyBaseProps = {
  instanceId: StorylyInstanceID;
};

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
