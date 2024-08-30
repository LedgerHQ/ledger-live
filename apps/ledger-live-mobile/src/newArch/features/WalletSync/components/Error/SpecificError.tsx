import React from "react";
import { ErrorReason, useSpecificError } from "../../hooks/useSpecificError";
import { DetailedError } from "./Detailed";

type Props = {
  error: ErrorReason;
  cancel?: () => void;
  understood?: () => void;
  goToDelete?: () => void;
  tryAgain?: () => void;
};

export const SpecificError = ({ error, cancel, goToDelete, understood, tryAgain }: Props) => {
  const { getErrorConfig } = useSpecificError({ cancel, goToDelete, understood, tryAgain });
  const config = getErrorConfig(error);

  return <DetailedError {...config} />;
};
