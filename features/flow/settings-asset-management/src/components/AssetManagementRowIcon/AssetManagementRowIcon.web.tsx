import React from "react";
import { CoinsCrypto, CoinsEye, EyeCross } from "@ledgerhq/lumen-ui-react/symbols";
import type { AssetManagementRowIconProps } from "./AssetManagementRowIcon.types";

const ICON_SIZE = 24;

export function AssetManagementRowIcon({ id }: AssetManagementRowIconProps) {
  switch (id) {
    case "hideEmptyTokenAccounts":
      return <CoinsEye size={ICON_SIZE} />;
    case "filterTokenOperationsZeroAmount":
      return <CoinsCrypto size={ICON_SIZE} />;
    case "hiddenTokens":
      return <EyeCross size={ICON_SIZE} />;
  }
}
