// @flow
import React, { useContext } from "react";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import type { TFunction } from "react-i18next";

export function getIsVoted(transaction: Transaction, address: string) {
  return !((transaction.votes || []).findIndex(v => v.address === address) < 0);
}

type SelectValidatorContextValue = {
  bridgePending: boolean,
  onContinue: () => void,
  // eslint-disable-next-line spaced-comment
  /** @TODO export data type from live-common **/
  onSelectSuperRepresentative: (item: any) => void,
  remainingCount: number,
  searchQuery: string,
  sections: Section[],
  setSearchQuery: (searchQuery: string) => void,
  status: any,
  t: TFunction,
  transaction: Transaction,
};

export type Section = {
  type: "superRepresentatives" | "candidates",
  // eslint-disable-next-line spaced-comment
  /** @TODO export data type from live-common **/
  data: any[],
};

const SelectValidatorContext = React.createContext<SelectValidatorContextValue>(
  {},
);

export const SelectValidatorProvider = SelectValidatorContext.Provider;

export function useSelectValidatorContext() {
  return useContext(SelectValidatorContext);
}
