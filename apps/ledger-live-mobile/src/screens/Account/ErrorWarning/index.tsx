import React, { memo } from "react";
import ErrorBanner from "./components/ErrorBanner";
import { useGlobalSyncState } from "@ledgerhq/live-common/bridge/react/index";

const ErrorWarning = () => {
  const { error } = useGlobalSyncState();

  return error ? <ErrorBanner error={error} /> : null;
};

export default memo(ErrorWarning);
