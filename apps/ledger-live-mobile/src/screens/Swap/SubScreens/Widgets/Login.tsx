import React from "react";
import { Widget } from "./Widget";
import { LoginProps } from "../../types";

export function Login({
  route: {
    params: { provider },
  },
}: LoginProps) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <Widget provider={provider} type="login" />;
    default:
      return null;
  }
}
