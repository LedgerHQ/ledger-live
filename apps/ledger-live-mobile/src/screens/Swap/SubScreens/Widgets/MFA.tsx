import React from "react";
import { MFAParamList } from "../../types";
import { Widget } from "./Widget";

export function MFA({
  route: {
    params: { provider },
  },
}: MFAParamList) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <Widget provider={provider} type="mfa" />;
    default:
      return null;
  }
}
