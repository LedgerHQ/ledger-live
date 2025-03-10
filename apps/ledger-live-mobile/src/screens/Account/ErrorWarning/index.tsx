import React, { memo } from "react";
import Error from "./components/Error";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";

const ErrorWarning = () => {
  const { error } = useGlobalSyncState();

  return error ? <Error error={error} /> : null;
};

export default memo(ErrorWarning);
