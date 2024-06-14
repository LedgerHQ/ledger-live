import React, { useContext } from "react";
import { TrustchainSDK } from "@ledgerhq/trustchain/types";
import { getSdk } from "@ledgerhq/trustchain/lib-es/index";

export const defaultContext = { applicationId: 16, name: "WebTools" };

export const TrustchainSDKContext = React.createContext<TrustchainSDK>(
  getSdk(false, defaultContext),
);

export const useTrustchainSDK = () => useContext(TrustchainSDKContext);
