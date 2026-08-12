import console from "console";
import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import {
  CASPER_FEES_MOTES,
  CASPER_MAX_TRANSFER_ID,
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
} from "@ledgerhq/coin-casper/constants";
import type { CasperAccount, Transaction } from "@ledgerhq/coin-casper/types";
import { deriveUser } from "./casperDevnet";
import {
  DEVNET_SANITY_USER_INDEX,
  liveDerivationPath,
  makeAccount,
  RECIPIENT_USER_INDEX,
} from "./fixtures";
import { getBridges, syncAccount } from "./helpers";
import { startIndexer } from "./indexer";

global.console = console;
jest.setTimeout(600_000);

// isAddressValid only verifies a checksum once the key has both cases, so flipping
// a letter is what makes it check at all — a digit would leave the key unchecked.
const upperCaseFirstHexLetter = (publicKey: string): string => {
  const at = [...publicKey].findIndex(c => /[a-f]/.test(c));
  return publicKey.slice(0, at) + publicKey[at].toUpperCase() + publicKey.slice(at + 1);
};

const feesMotes = new BigNumber(CASPER_FEES_MOTES);
const minimumValidAmountMotes = new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES);

// getTransactionStatus errors that need a real synced balance and a real
// chain-derived recipient, which a mocked account can't stand in for.
describe("Casper negative cases (devnet)", () => {
  let accountBridge: AccountBridge<Transaction, CasperAccount>;
  let account: CasperAccount;
  let recipientPublicKey: string;
  let closeIndexer: () => void;

  beforeAll(async () => {
    closeIndexer = startIndexer();

    const sender = await deriveUser(DEVNET_SANITY_USER_INDEX);
    const recipient = await deriveUser(RECIPIENT_USER_INDEX);
    recipientPublicKey = recipient.publicKey;

    ({ accountBridge } = getBridges({
      [liveDerivationPath(DEVNET_SANITY_USER_INDEX)]: sender.secretKey,
    }));

    const initial = makeAccount({ publicKey: sender.publicKey, index: DEVNET_SANITY_USER_INDEX });
    account = await syncAccount(accountBridge, initial);
    expect(account.balance.gt(0)).toBe(true);
  });

  afterAll(() => {
    closeIndexer?.();
  });

  // getTransactionStatus reads transaction.fees directly rather than
  // estimating it, so the fee has to be supplied here for totalSpent to mean
  // anything.
  const build = (patch: Partial<Transaction>): Transaction =>
    accountBridge.updateTransaction(accountBridge.createTransaction(account), {
      fees: feesMotes,
      ...patch,
    } as Partial<Transaction>);

  it("flags a spend above the synced balance (NotEnoughBalance)", async () => {
    const tx = build({
      recipient: recipientPublicKey,
      amount: account.balance.times(2),
    });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.amount?.name).toBe("NotEnoughBalance");
  });

  it("flags an amount below CASPER_MINIMUM_VALID_AMOUNT_MOTES (InvalidMinimumAmount)", async () => {
    const tx = build({
      recipient: recipientPublicKey,
      amount: minimumValidAmountMotes.minus(1),
    });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.amount?.name).toBe("InvalidMinimumAmount");
  });

  it("flags a recipient with a broken CEP-57 checksum (InvalidAddress)", async () => {
    const tx = build({
      recipient: upperCaseFirstHexLetter(recipientPublicKey),
      amount: minimumValidAmountMotes,
    });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.recipient?.name).toBe("InvalidAddress");
  });

  it("flags a transferId equal to CASPER_MAX_TRANSFER_ID, not just above it (CasperInvalidTransferId)", async () => {
    const tx = build({
      recipient: recipientPublicKey,
      amount: minimumValidAmountMotes,
      transferId: CASPER_MAX_TRANSFER_ID,
    });
    const status = await accountBridge.getTransactionStatus(account, tx);
    expect(status.errors.transaction?.name).toBe("CasperInvalidTransferId");
  });
});
