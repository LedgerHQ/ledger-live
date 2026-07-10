import { useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { atom, PrimitiveAtom, useAtom } from "jotai";
import { atomFamily, AtomFamily } from "jotai-family";
import { SetCurrentAccountHistDb } from "./types";

// Atom family for manifest-scoped account state - each manifest gets its own isolated atom
export const currentAccountAtomFamily: AtomFamily<
  string,
  PrimitiveAtom<AccountLike | null>
> = atomFamily((_manifestId: string) => atom<AccountLike | null>(null));

export function useDappCurrentAccount(
  manifestId: string,
  setCurrentAccountHistDb?: SetCurrentAccountHistDb,
) {
  const atomToUse = currentAccountAtomFamily(manifestId);
  const [currentAccount, setCurrentAccount] = useAtom(atomToUse);

  // prefer using this setter when the user manually sets a current account
  const setCurrentAccountHist = useCallback(
    (id: string, account: AccountLike) => {
      setCurrentAccountHistDb?.(state => {
        const newState = {
          ...state,
          currentAccountHist: {
            ...state.currentAccountHist,
            [id]: account.id,
          },
        };
        return newState;
      });
    },
    [setCurrentAccountHistDb],
  );

  return { currentAccount, setCurrentAccount, setCurrentAccountHist };
}
