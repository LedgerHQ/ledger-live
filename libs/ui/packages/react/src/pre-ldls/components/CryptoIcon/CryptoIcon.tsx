import React from "react";
import { CryptoIcon as Icon } from "@ledgerhq/crypto-icons";

export function CryptoIcon(props: Parameters<typeof Icon>[0]) {
  return <Icon {...props} />;
}
