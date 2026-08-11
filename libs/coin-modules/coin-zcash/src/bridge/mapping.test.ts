import { BigNumber } from "bignumber.js";
import { mapOutputs, mapSpends, mapTransparentInputs } from "./mapping";
import type { BitcoinOutput, Transaction, ZcashAccount } from "../types/bridge";
import type { SpendableNote } from "../network/types";

const T_ADDRESS = "t1b1Rbw2shhJkP6MCnCyxCPuyFedHrwKty8";
const CHANGE_ADDRESS = "t1cHaNge2shhJkP6MCnCyxCPuyFedHrwKty8";
const TXID_DISPLAY = "0011223344556677889900112233445566778899001122334455667788990011";

const note = (amount: number, index: number): SpendableNote =>
  ({
    amount: new BigNumber(amount),
    nullifier: index.toString(16).padStart(2, "0").repeat(32),
    rho: "ee".repeat(32),
    rseed: "ff".repeat(32),
    cmx: "11".repeat(32),
    position: String(index),
    recipient: "22".repeat(43),
    isSpent: false,
  }) as unknown as SpendableNote;

const utxo = (overrides: Partial<BitcoinOutput> = {}): BitcoinOutput => ({
  hash: TXID_DISPLAY,
  outputIndex: 2,
  blockHeight: 3_425_800,
  address: T_ADDRESS,
  value: new BigNumber(70_000),
  rbf: false,
  isChange: false,
  ...overrides,
});

function accountWithWallet(): ZcashAccount {
  const crypto = {
    getPubkeyAt: jest.fn(async (_xpub: string, account: number, index: number) =>
      Buffer.from([0x02, account, index]),
    ),
    toOutputScript: jest.fn((address: string) => Buffer.from(`script:${address}`)),
  };

  return {
    id: "js:2:zcash:xpub6D:",
    bitcoinResources: {
      utxos: [],
      walletAccount: {
        xpub: {
          xpub: "xpub6D",
          crypto,
          getAccountAddresses: jest.fn(async (scope: number) =>
            scope === 0
              ? [{ address: T_ADDRESS, account: 0, index: 3 }]
              : [{ address: CHANGE_ADDRESS, account: 1, index: 7 }],
          ),
        },
      },
    },
  } as unknown as ZcashAccount;
}

describe("mapSpends", () => {
  it("carries the note's spending material and states its value in zatoshis", () => {
    expect(mapSpends([note(40_000, 1)])).toEqual([
      {
        recipient: "22".repeat(43),
        valueZat: "40000",
        rho: "ee".repeat(32),
        rseed: "ff".repeat(32),
        cmx: "11".repeat(32),
        position: "1",
      },
    ]);
  });

  it("maps nothing for an empty selection", () => {
    expect(mapSpends([])).toEqual([]);
  });
});

describe("mapOutputs", () => {
  const tx = (overrides: Partial<Transaction> = {}): Transaction =>
    ({
      family: "zcash",
      transferType: "shielded",
      amount: new BigNumber(12_345),
      recipient: T_ADDRESS,
      ...overrides,
    }) as Transaction;

  it("sends the amount to the recipient", () => {
    expect(mapOutputs(tx())).toEqual([{ address: T_ADDRESS, valueZat: "12345" }]);
  });

  it("attaches a memo only when there is one", () => {
    expect(mapOutputs(tx({ memo: "hello" }))[0]).toHaveProperty("memo", "hello");
    expect(mapOutputs(tx({ memo: "" }))[0]).toHaveProperty("memo", "");
    expect(mapOutputs(tx())[0]).not.toHaveProperty("memo");
  });
});

describe("mapTransparentInputs", () => {
  it("resolves the derivation of each UTXO and reverses the txid for the builder", async () => {
    const account = accountWithWallet();

    const [input] = await mapTransparentInputs(account, [utxo()]);

    // The builder wants the internal (little-endian) txid, the account stores
    // the display (big-endian) one.
    expect(input.txid).toBe(Buffer.from(TXID_DISPLAY, "hex").reverse().toString("hex"));
    expect(input).toMatchObject({
      vout: 2,
      valueZat: "70000",
      derivationScope: 0,
      addressIndex: 3,
      scriptPubKey: Buffer.from(`script:${T_ADDRESS}`).toString("hex"),
      pubkey: "020003",
    });
  });

  it("recognises a change address as well as a receive one", async () => {
    const [input] = await mapTransparentInputs(accountWithWallet(), [
      utxo({ address: CHANGE_ADDRESS, isChange: true }),
    ]);

    expect(input).toMatchObject({ derivationScope: 1, addressIndex: 7 });
  });

  it("resolves each coin on its own, in the order it was given them", async () => {
    const inputs = await mapTransparentInputs(accountWithWallet(), [
      utxo({ address: CHANGE_ADDRESS, isChange: true, value: new BigNumber(1_000) }),
      utxo({ outputIndex: 5, value: new BigNumber(2_000) }),
    ]);

    expect(inputs).toMatchObject([
      { valueZat: "1000", vout: 2, derivationScope: 1, addressIndex: 7, pubkey: "020107" },
      { valueZat: "2000", vout: 5, derivationScope: 0, addressIndex: 3, pubkey: "020003" },
    ]);
  });

  it("asks the wallet for nothing when there is nothing to spend", async () => {
    const account = accountWithWallet();

    expect(await mapTransparentInputs(account, [])).toEqual([]);
    expect(account.bitcoinResources.walletAccount?.xpub.getAccountAddresses).not.toHaveBeenCalled();
  });

  // Fail closed: signing a UTXO we cannot derive would produce an unsignable
  // or simply wrong input.
  it.each([
    ["it carries no address", utxo({ address: null })],
    ["its address is empty", utxo({ address: "" })],
    ["its address belongs to no known derivation", utxo({ address: "t1someoneElse" })],
  ])("refuses to map a coin when %s", async (_label, input) => {
    await expect(mapTransparentInputs(accountWithWallet(), [input])).rejects.toMatchObject({
      name: "ZcashUtxoNotInAccount",
      txid: input.hash,
      vout: input.outputIndex,
    });
  });
});
