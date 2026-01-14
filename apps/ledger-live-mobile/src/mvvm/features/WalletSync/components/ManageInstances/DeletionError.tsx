import React from "react";
import { ErrorReason, SpecificProps } from "../../hooks/useSpecificError";
import { SpecificError } from "../Error/SpecificError";

type Props = SpecificProps & {
  error: ErrorReason;
};

export const DeletionError = (props: Props) => {
  return <SpecificError {...props} />;
};
