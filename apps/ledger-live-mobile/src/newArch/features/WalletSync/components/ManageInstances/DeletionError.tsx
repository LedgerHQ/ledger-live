import React from "react";
import { ErrorReason } from "../../hooks/useSpecificError";
import { SpecificError } from "../Error/SpecificError";

type Props = {
  error: ErrorReason;
  tryAgain?: () => void;
  understood?: () => void;
  goToDelete?: () => void;
};

export const DeletionError = (props: Props) => {
  return <SpecificError {...props} />;
};
