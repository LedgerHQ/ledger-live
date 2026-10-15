import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { HeaderView } from "./HeaderView";
import { useHeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ account: Account }>;

export function Header({ account }: Props) {
  return <HeaderView viewModel={useHeaderViewModel(account)} />;
}
