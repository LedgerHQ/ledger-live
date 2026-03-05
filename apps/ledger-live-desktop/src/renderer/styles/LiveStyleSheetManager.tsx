import React from "react";
import { StyleSheetManager } from "styled-components";
import { shouldForwardProp } from "./shouldForwardProp";

const LiveStyleSheetManager = ({ children }: { children: React.ReactNode }) => (
  <StyleSheetManager shouldForwardProp={shouldForwardProp}>{children}</StyleSheetManager>
);
export default LiveStyleSheetManager;
