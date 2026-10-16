import { BigNumber } from "bignumber.js";
import { emptyState, versioned } from "@ledgerhq/account-module-utxo";
import type { AccountOperation } from "@ledgerhq/account-module-framework";
import type { Operation } from "@ledgerhq/types-live";
import { bitcoinAccountModuleBinding as binding } from "./binding";
import { getSerializedAddressParameters } from "./exchange";
import { accountOptions } from "./intent";
import { decorateOptimisticOperation, isPendingSettled, mergeSentOperation } from "./pending";
import { readBitcoinState } from "./state";

describe("bitcoinAccountModuleBinding", () => {
  it("reads the xpub of the account path on the device", async () => {
    const getWalletXpub = jest.fn(async () => "xpub");
    const signerContext = jest.fn(async (_deviceId, fn) => fn({ getWalletXpub }));
    const key = await binding.getAccountKey(
      {
        currencyId: "bitcoin",
        derivationPath: "84'/0'/1'",
        derivationMode: "native_segwit",
        deviceId: "d",
      },
      signerContext as never,
    );
    expect(key).toBe("xpub");
    expect(signerContext).toHaveBeenCalledWith("d", expect.any(Function));
    expect(getWalletXpub).toHaveBeenCalledWith({
      currencyId: "bitcoin",
      path: "84'/0'/1'",
      xpubVersion: 0x0488b21e,
    });
  });

  it("needs a device to read the xpub", async () => {
    await expect(
      binding.getAccountKey(
        {
          currencyId: "bitcoin",
          derivationPath: "84'/0'/1'",
          derivationMode: "",
          deviceId: undefined,
        },
        jest.fn() as never,
      ),
    ).rejects.toThrow("deviceId required to generate the xpub");
  });

  it("serves the account with the UTXO account module on the coin module", () => {
    const module = binding.create({} as never, "bitcoin");
    expect(module).toMatchObject({
      getUTXOs: expect.any(Function),
      getChangeAddress: expect.any(Function),
    });
  });

  it("fills the bitcoin resources from the module's outputs and persists its state", async () => {
    const state = versioned(emptyState());
    const getUTXOs = jest.fn(async () => [
      {
        txid: "t",
        vout: 1,
        value: 5000n,
        address: "bc1qme",
        derivationPath: "84'/0'/0'/1/0",
        height: null,
        replaceable: true,
        change: true,
      },
    ]);
    const fields = await binding.accountFields({ key: "xpub", state, getUTXOs });
    expect(fields).toEqual({
      xpub: "xpub",
      bitcoinResources: {
        utxos: [
          {
            hash: "t",
            outputIndex: 1,
            blockHeight: null,
            address: "bc1qme",
            value: new BigNumber(5000),
            rbf: true,
            isChange: true,
          },
        ],
        accountState: state,
      },
    });

    const unsynced = await binding.accountFields({
      key: "xpub",
      state: undefined,
      getUTXOs: async () => [],
    });
    expect(unsynced).toEqual({ xpub: "xpub", bitcoinResources: { utxos: [] } });
  });

  it("tells the height the module last synced at, none for a state it does not trust", () => {
    expect(binding.syncedHeight(versioned({ ...emptyState(), syncedHeight: 812 }))).toBe(812);
    expect(binding.syncedHeight(undefined)).toBeUndefined();
    expect(binding.syncedHeight({ version: -1, data: {} })).toBeUndefined();
  });

  it("shows an operation with its spent outpoints, and a sequence number of 0 when it has none", () => {
    const live = { id: "op", extra: { replaceable: true } } as unknown as Operation;
    const operation = {
      details: { inputs: ["p-0"], replaceable: true },
    } as unknown as AccountOperation;
    expect(binding.toLiveOperation?.(operation, live)).toEqual({
      id: "op",
      transactionSequenceNumber: new BigNumber(0),
      extra: { inputs: ["p-0"] },
    });
    const sequenced = { ...live, transactionSequenceNumber: new BigNumber(3) };
    expect(binding.toLiveOperation?.(operation, sequenced)?.transactionSequenceNumber).toEqual(
      new BigNumber(3),
    );
  });

  it("keeps the Ledger Wallet presentation of the family", () => {
    expect(binding).toMatchObject({
      readState: readBitcoinState,
      accountOptions,
      isPendingSettled,
      mergeSentOperation,
      decorateOptimisticOperation,
      getSerializedAddressParameters,
    });
  });
});
