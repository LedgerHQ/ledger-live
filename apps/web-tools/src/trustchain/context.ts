import React, { useContext } from "react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { LEDGER_SYNC_BACKENDS } from "./backends";

export const defaultContext = {
  applicationId: 16,
  name: "WebTools",
  apiBaseUrl: LEDGER_SYNC_BACKENDS.staging.trustchainApiBaseUrl,
};

export const TrustchainSDKContext = React.createContext<TrustchainSDK>(
  getSdk(false, defaultContext, withDevice),
);

export const useTrustchainSDK = () => useContext(TrustchainSDKContext);
