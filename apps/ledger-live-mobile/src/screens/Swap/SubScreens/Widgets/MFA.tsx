import React from "react";
import { MFAProps } from "../../types";
import { Widget } from "./Widget";

export function MFA({
  route: {
    params: { provider },
  },
}: MFAProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <Widget provider={provider} type="mfa" />;
    default:
      return null;
  }
}
