import React from "react";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { AccountDetailSectionView } from "./AccountDetailSectionView";
import {
  useAccountDetailSectionViewModel,
  type SolanaDetailAccount,
} from "./useAccountDetailSectionViewModel";

type Props = Readonly<{
  account: SolanaDetailAccount;
  parentAccount?: SolanaAccount | null;
}>;

const AccountDetailSection = ({ account, parentAccount }: Props) => (
  <AccountDetailSectionView {...useAccountDetailSectionViewModel(account, parentAccount)} />
);

export default AccountDetailSection;
