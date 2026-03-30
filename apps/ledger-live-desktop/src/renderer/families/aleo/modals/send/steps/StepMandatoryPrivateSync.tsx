import React, { useEffect } from "react";
import type { StepProps } from "~/renderer/modals/Send/types";

const StepMandatoryPrivateSync = ({ transitionTo }: StepProps) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      transitionTo("record-picker");
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [transitionTo]);

  return <p>simulating private sync...</p>;
};

export default StepMandatoryPrivateSync;
