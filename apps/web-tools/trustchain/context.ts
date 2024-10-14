import React, { useContext } from "react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { TrustchainSDK } from "@ledgerhq/ledger-key-ring-protocol/types";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { getEnv } from "@ledgerhq/live-env";

export const defaultContext = {
  applicationId: 16,
  name: "WebTools",
  apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
};

export const TrustchainSDKContext = React.createContext<TrustchainSDK>(
  getSdk(false, defaultContext, withDevice),
);

export const useTrustchainSDK = () => useContext(TrustchainSDKContext);
