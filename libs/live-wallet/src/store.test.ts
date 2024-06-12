import { handlers, initialState } from "./store";
import type { Account } from "@ledgerhq/types-live";

const ETHEREUM_ACCOUNT = "js:2:ethereum:0x23304541225D9b0BA2368B55ERTYF:";
const POLKADOT_ACCOUNT =
  "js:2:polkadot:133vQbgqtsMufsPbhH9uHWLsdfdsfsdfxw2yRjxC56Tcztg6VeLK:polkadotbip44:";

const ETHEREUM_ACCOUNT_NAME = "My name is ethereum";
const POLKADOT_ACCOUNT_NAME = "My name is polkadot";

initialState.accountNames.set(ETHEREUM_ACCOUNT, ETHEREUM_ACCOUNT_NAME);
initialState.accountNames.set(POLKADOT_ACCOUNT, POLKADOT_ACCOUNT_NAME);

initialState.starredAccountIds.add(ETHEREUM_ACCOUNT);

const NEW_POLKADOT_ACCOUNT =
  "js:2:polkadot:133vQbgqtsMufsPbhH9uHWLsdfdsfsdfxw2yRjxC5azeazeazezaVeLK:polkadotbip44:";
const NEW_POLKADOT_ACCOUNT_NAME = "My name is new polkadot";

describe("Wallet store", () => {
  it("should add an account", (): void => {
    const editedNames = new Map();
    editedNames.set(NEW_POLKADOT_ACCOUNT, NEW_POLKADOT_ACCOUNT_NAME);
    const result = handlers.ADD_ACCOUNTS(initialState, {
      payload: {
        allAccounts: [
          { id: ETHEREUM_ACCOUNT, type: "Account", currency: { name: "Ethereum" } } as Account,
          { id: POLKADOT_ACCOUNT, type: "Account", currency: { name: "Polkadot" } } as Account,
          { id: NEW_POLKADOT_ACCOUNT, type: "Account", currency: { name: "Polkadot" } } as Account,
        ],
        editedNames,
      },
    });
    expect(result.accountNames.get(ETHEREUM_ACCOUNT)).toBe(ETHEREUM_ACCOUNT_NAME);
    expect(result.accountNames.get(POLKADOT_ACCOUNT)).toBe(POLKADOT_ACCOUNT_NAME);
    expect(result.accountNames.get(NEW_POLKADOT_ACCOUNT)).toBe(NEW_POLKADOT_ACCOUNT_NAME);
  });
});
