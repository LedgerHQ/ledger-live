import React from "react";
import { AccountAssetPicker, AccountHero } from "@features/flow-account-detail-hero/native";
import { TransferDrawer } from "LLM/features/QuickActions";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import type { AccountHeroPortResult } from "./useAccountHeroPort";

export function Hero({ port, assetPicker }: AccountHeroPortResult) {
  return (
    <>
      <AccountHero {...port} testID={ACCOUNT_DETAIL_TEST_IDS.hero} />
      <TransferDrawer />
      <AccountAssetPicker {...assetPicker} testID={ACCOUNT_DETAIL_TEST_IDS.assetPicker} />
    </>
  );
}
