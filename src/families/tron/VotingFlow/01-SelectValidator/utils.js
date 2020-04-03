// @flow
import React, { useContext } from "react";
import type { TFunction } from "react-i18next";
import type { Transaction } from "@ledgerhq/live-common/lib/types";
import type { SuperRepresentative } from "@ledgerhq/live-common/lib/families/tron/types";

export function getIsVoted(transaction: Transaction, address: string) {
  return !((transaction.votes || []).findIndex(v => v.address === address) < 0);
}

type SelectValidatorContextValue = {
  bridgePending: boolean,
  onContinue: () => void,
  onSelectSuperRepresentative: (item: Item) => void,
  remainingCount: number,
  searchQuery: string,
  sections: Section[],
  setSearchQuery: (searchQuery: string) => void,
  status: any,
  t: TFunction,
  transaction: Transaction,
};

export type Section = {
  type: "selected" | "superRepresentatives" | "candidates",
  data: Item[],
};

// eslint-disable-next-line spaced-comment
/** @TODO export data type from live-common **/
export type Item = {
  address: string,
  sr: SuperRepresentative,
  isSR: boolean,
  rank: number,
};

const SelectValidatorContext = React.createContext<SelectValidatorContextValue>(
  {},
);

export const SelectValidatorProvider = SelectValidatorContext.Provider;

export function useSelectValidatorContext() {
  return useContext(SelectValidatorContext);
}
