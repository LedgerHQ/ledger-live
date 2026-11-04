import React from "react";
import { AccountAssetPicker, AccountHero } from "@features/flow-account-detail-hero/web";
import type { AccountHeroPortResult } from "./useAccountHeroPort";

export function Hero({ port, assetPicker }: AccountHeroPortResult) {
  return (
    <>
      <AccountHero {...port} testID="account-detail-hero" />
      <AccountAssetPicker {...assetPicker} />
    </>
  );
}
