import family from "../index";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Operation } from "@ledgerhq/types-live";
import type { Features } from "@shared/feature-flags";

const makeAccount = (currencyId: string, privateInfo?: object) => ({
  ...createFixtureAccount(),
  currency: { id: currencyId, family: "bitcoin" },
  ...(privateInfo !== undefined ? { privateInfo } : {}),
});

const flags = (zcashEnabled: boolean): Features =>
  ({ zcashShielded: { enabled: zcashEnabled } }) as unknown as Features;

const predicate = family.useCustomConfirmAddress as (
  account: ReturnType<typeof makeAccount>,
  featureFlags: Features,
) => boolean;

describe("bitcoinFamily.useCustomConfirmAddress", () => {
  it("returns false for a non-Zcash account regardless of the flag", () => {
    expect(predicate(makeAccount("bitcoin"), flags(true))).toBe(false);
    expect(predicate(makeAccount("litecoin"), flags(true))).toBe(false);
  });

  it("returns false for a Zcash account when the flag is disabled", () => {
    const account = makeAccount("zcash", { shieldedAddress: "u1abc", ufvk: "uview1test" });
    expect(predicate(account, flags(false))).toBe(false);
  });

  it("returns false for a Zcash account with the flag on but no shielded address", () => {
    expect(predicate(makeAccount("zcash"), flags(true))).toBe(false);
    expect(predicate(makeAccount("zcash", { ufvk: "uview1test" }), flags(true))).toBe(false);
    expect(predicate(makeAccount("zcash", { shieldedAddress: null }), flags(true))).toBe(false);
  });

  it("returns true for a Zcash account with the flag on and a shielded address present", () => {
    const account = makeAccount("zcash", { shieldedAddress: "u1abc", ufvk: "uview1test" });
    expect(predicate(account, flags(true))).toBe(true);
  });
});

const editFlags = (enabled: boolean, supportedCurrencyIds?: string[]) => ({
  bitcoin: { enabled, supportedCurrencyIds },
});

describe("bitcoinFamily.handlesEditTransaction", () => {
  const mainAccount: BitcoinAccount = {
    ...genAccount("bitcoin-edit-transaction", {
      currency: getCryptoCurrencyById("bitcoin"),
      operationsSize: 0,
    }),
    bitcoinResources: { utxos: [] },
  };
  const pendingOperation = {
    hash: "pending-hash",
    blockHeight: null,
    transactionRaw: undefined,
  } as unknown as Operation;
  const handlesEditTransaction = (
    operation: Operation,
    featureFlags: ReturnType<typeof editFlags>,
  ) =>
    family.handlesEditTransaction?.({
      account: mainAccount,
      parentAccount: undefined,
      mainAccount,
      operation,
      bridge: {} as never,
      featureFlags,
    });

  it("builds a replacement of an operation sent elsewhere", () => {
    expect(handlesEditTransaction(pendingOperation, editFlags(true, ["bitcoin"]))).toEqual({
      modalName: "MODAL_BITCOIN_EDIT_TRANSACTION",
      params: {
        account: mainAccount,
        parentAccount: undefined,
        transactionRaw: {
          family: "bitcoin",
          amount: "0",
          recipient: mainAccount.freshAddress,
          familySpecificData: {
            rbf: true,
            utxoStrategy: { strategy: 0, excludeUTXOs: [] },
            replaceTxId: "pending-hash",
          },
        },
        transactionHash: "pending-hash",
      },
    });
  });

  it("replaces the operation itself, not the one a stored transaction replaced", () => {
    const transactionRaw = {
      family: "bitcoin",
      amount: "1000",
      recipient: "bc1qrecipient",
      familySpecificData: { rbf: true, feePerByte: "3", replaceTxId: "older-hash" },
    };
    const operation = { ...pendingOperation, transactionRaw };

    expect(
      handlesEditTransaction(operation, editFlags(true, ["bitcoin"]))?.params.transactionRaw,
    ).toEqual({
      ...transactionRaw,
      familySpecificData: { rbf: true, feePerByte: "3", replaceTxId: "pending-hash" },
    });
  });

  it("does not edit a confirmed operation", () => {
    const confirmed = { ...pendingOperation, blockHeight: 10 };

    expect(handlesEditTransaction(confirmed, editFlags(true, ["bitcoin"]))).toBeNull();
  });

  it("does not edit when the feature is off or the currency unsupported", () => {
    expect(handlesEditTransaction(pendingOperation, editFlags(false, ["bitcoin"]))).toBeNull();
    expect(handlesEditTransaction(pendingOperation, editFlags(true, ["litecoin"]))).toBeNull();
    expect(handlesEditTransaction(pendingOperation, editFlags(true))).toBeNull();
  });
});
