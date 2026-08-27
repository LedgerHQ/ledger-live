import React from "react";
import { BankTransferIntroView } from "./BankTransferIntroView";
import type { BankTransferIntroProps } from "../../types";
import { useBankTransferIntroViewModel } from "./useBankTransferIntroViewModel";

export function BankTransferIntro(props: BankTransferIntroProps) {
  return <BankTransferIntroView {...useBankTransferIntroViewModel(props)} />;
}
