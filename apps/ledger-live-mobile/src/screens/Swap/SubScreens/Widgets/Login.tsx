import React from "react";
import { Widget } from "./Widget";
import { LoginParamList } from "../../types";

export function Login({
  route: {
    params: { provider },
  },
}: LoginParamList) {
  switch (provider) {
    case "ftx":
    case "ftxus":
      return <Widget provider={provider} type="login" />;
    default:
      return null;
  }
}
