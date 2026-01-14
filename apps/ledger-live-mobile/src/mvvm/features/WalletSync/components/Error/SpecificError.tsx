import React from "react";
import { ErrorReason, SpecificProps, useSpecificError } from "../../hooks/useSpecificError";
import { DetailedError } from "./Detailed";

export const SpecificError = ({
  error,
  primaryAction,
  secondaryAction,
}: SpecificProps & {
  error: ErrorReason;
}) => {
  const { getErrorConfig } = useSpecificError({ primaryAction, secondaryAction });
  const config = getErrorConfig(error);

  return <DetailedError {...config} />;
};
