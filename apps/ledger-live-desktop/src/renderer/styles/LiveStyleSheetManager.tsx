import React from "react";
import { StyleSheetManager } from "styled-components";
const LiveStyleSheetManager = ({ children }: { children: React.ReactNode }) => (
  <StyleSheetManager>{children}</StyleSheetManager>
);
export default LiveStyleSheetManager;
