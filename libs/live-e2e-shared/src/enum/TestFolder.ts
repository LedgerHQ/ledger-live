// The folder under the team in the Allure tree (Team / Folder / test), the same on both apps.
export enum TestFolder {
  ACCOUNTS = "Accounts",
  SUBACCOUNTS = "Subaccounts",
  RECEIVE = "Receive",
  SEND_NATIVE = "Send Native",
  SEND_TOKEN_ACCOUNT = "Send Token account",
  DELEGATE = "Delegate",
  LEGACY_TESTS = "Legacy tests",
}

// A send belongs to the token folder when the account it debits is a token account.
export function sendFolder(accountToDebit: { parentAccount?: unknown }): TestFolder {
  return accountToDebit.parentAccount ? TestFolder.SEND_TOKEN_ACCOUNT : TestFolder.SEND_NATIVE;
}

// The scenario under a send folder (Team / Send folder / Scenario / test), the same on both apps.
export enum SendScenario {
  TRANSACTION = "Transaction",
  VALID_ADDRESS = "Valid Address",
  INVALID_ADDRESS = "Invalid Address",
  ENS_ADDRESS = "ENS Address",
  INVALID_AMOUNT = "Invalid Amount",
  MAX_AMOUNT = "Max Amount",
  MEMO = "Memo",
  ADDRESS_BOOK = "Address Book",
  FEE_PAID_WITH_TRONIFY = "Fee Paid with Tronify",
}

// Where a test sits under its team: the folder, and the scenario for a send.
export type PlacementOptions = {
  folder: TestFolder;
  scenario?: SendScenario;
};
