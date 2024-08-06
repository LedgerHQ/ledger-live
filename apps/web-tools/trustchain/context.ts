import React, { useContext } from "react";
import { TrustchainSDK } from "@ledgerhq/trustchain/types";
import { getSdk } from "@ledgerhq/trustchain/index";
import { getEnv } from "@ledgerhq/live-env";

export const defaultContext = {
  applicationId: 16,
  name: "WebTools",
  apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
};

export const TrustchainSDKContext = React.createContext<TrustchainSDK>(
  getSdk(false, defaultContext),
);

export const useTrustchainSDK = () => useContext(TrustchainSDKContext);
