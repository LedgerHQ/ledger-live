import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountAssetPickerDialog, AccountHero } from "@features/flow-account-detail-hero/web";
import { useAccountHeroPort } from "./useAccountHeroPort";

type Props = Readonly<{ account: Account }>;

export function Hero({ account }: Props) {
  const { port, assetPicker } = useAccountHeroPort(account);
  return (
    <>
      <AccountHero {...port} testID="account-detail-hero" />
      <AccountAssetPickerDialog {...assetPicker} />
    </>
  );
}
