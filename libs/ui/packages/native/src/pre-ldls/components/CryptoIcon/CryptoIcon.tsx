import React from "react";
import Icon from "@ledgerhq/crypto-icons/native";

export function CryptoIcon(props: Parameters<typeof Icon>[0]) {
  return <Icon {...props} />;
}
