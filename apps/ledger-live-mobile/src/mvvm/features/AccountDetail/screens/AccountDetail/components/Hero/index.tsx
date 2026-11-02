import React from "react";
import { AccountHero } from "@features/flow-account-detail-hero/native";
import { TransferDrawer } from "LLM/features/QuickActions";
import { AccountAssetPickerSheet } from "LLM/components/AccountAssetPickerSheet";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import type { AccountHeroPortResult } from "./useAccountHeroPort";

export function Hero({ port, assetPicker }: AccountHeroPortResult) {
  return (
    <>
      <AccountHero {...port} testID={ACCOUNT_DETAIL_TEST_IDS.hero} />
      <TransferDrawer />
      <AccountAssetPickerSheet {...assetPicker} testID={ACCOUNT_DETAIL_TEST_IDS.assetPicker} />
    </>
  );
}
