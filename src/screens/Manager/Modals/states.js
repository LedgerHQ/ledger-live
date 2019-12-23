import React, { useState } from "react";

export const useStorageWarningModal = () => {
  const [warning, setWarning] = useState();
  return [warning, setWarning];
};
