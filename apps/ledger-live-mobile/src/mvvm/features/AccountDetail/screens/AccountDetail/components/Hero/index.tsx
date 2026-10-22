import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountHero } from "@features/flow-account-detail-hero/native";
import { TransferDrawer } from "LLM/features/QuickActions";
import { AccountAssetPickerSheet } from "LLM/components/AccountAssetPickerSheet";
import { ACCOUNT_DETAIL_TEST_IDS } from "../../../../testIds";
import { useAccountHeroPort } from "./useAccountHeroPort";

type Props = Readonly<{ account: Account }>;

export function Hero({ account }: Props) {
  const { port, assetPicker } = useAccountHeroPort(account);

  return (
    <>
      <AccountHero {...port} testID={ACCOUNT_DETAIL_TEST_IDS.hero} />
      <TransferDrawer />
      <AccountAssetPickerSheet {...assetPicker} testID={ACCOUNT_DETAIL_TEST_IDS.assetPicker} />
    </>
  );
}
