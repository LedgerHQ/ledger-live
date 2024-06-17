import React, { useContext } from "react";
import { TrustchainSDK } from "@ledgerhq/trustchain/types";
import { getSdk } from "@ledgerhq/trustchain/lib-es/index";

export const defaultContext = { applicationId: 16, name: "WebTools" };

export const SDKContext = React.createContext<TrustchainSDK>(getSdk(false, defaultContext));

export const useSDK = () => useContext(SDKContext);
