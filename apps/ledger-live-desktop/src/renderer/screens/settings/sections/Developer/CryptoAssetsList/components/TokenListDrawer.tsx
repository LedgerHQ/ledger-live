import React from "react";
import { TokenListView } from "./TokenListView";
import { TokenListDrawerProps } from "../types";

export const TokenListDrawer: React.FC<TokenListDrawerProps> = ({ initialFamily = "ethereum" }) => {
  return <TokenListView initialFamily={initialFamily} />;
};
