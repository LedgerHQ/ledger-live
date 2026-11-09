import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { LedgerSigner } from "@mysten/ledger-signer";
import { bcs } from "@mysten/sui/bcs";
import { Transaction as SuiTransaction } from "@mysten/sui/transactions";
import { fromBase64, fromHex, toBase64 } from "@mysten/sui/utils";
import { lastValueFrom, toArray } from "rxjs";
import coinConfig from "../config";
import {
  SuiAddressBalanceAppUpdateRequired,
  SuiRawTransactionInvalid,
  SuiRawTransactionResolutionFailed,
  SuiRawTransactionSenderMismatch,
  SuiSponsoredTransactionBroadcastUnsupported,
} from "../errors";
import { buildRawTransaction } from "../network/sdk";
import { HBTC_COIN_TYPE, HBTC_TOKEN } from "../test/fixtures";
import type { SuiAccount, SuiSigner } from "../types";
import { toLongStructTag } from "../utils";
import { buildSignRawOperation } from "./signRawOperation";

jest.mock("@mysten/ledger-signer", () => ({
  LedgerSigner: { fromDerivationPath: jest.fn() },
  getInputObjects: jest.fn(),
}));

jest.mock("../network/sdk", () => ({
  ...jest.requireActual("../network/sdk"),
  buildRawTransaction: jest.fn(),
}));

const mockBuildRawTransaction = buildRawTransaction as jest.MockedFunction<
  typeof buildRawTransaction
>;

const HASHI_PACKAGE = "0xd30fb3f8914efdbeb7b8e85fae1d65dc584b44a1281f66737b92bb9f03a59d06";
const HASHI_OBJECT = "0x8d110642d9b5133bd661cda4873edf135ab6b91ff6918601015880874b950e5d";
const SENDER = `0x${"11".repeat(32)}`;
const OTHER_ADDRESS = `0x${"22".repeat(32)}`;
const SPONSOR = `0x${"33".repeat(32)}`;
const GAS_COIN = { objectId: `0x${"44".repeat(32)}`, version: "7", digest: "1".repeat(32) };
const SPONSOR_GAS_COIN = { objectId: `0x${"55".repeat(32)}`, version: "9", digest: "1".repeat(32) };

// flag (Ed25519) || 64-byte signature || 32-byte public key, as the Ledger signer returns it.
const SERIALIZED_SIGNATURE = toBase64(
  new Uint8Array([0, ...new Uint8Array(64).fill(0x42), ...new Uint8Array(32).fill(0x01)]),
);

// Real `tx.build()` bytes: an address-balance send, the shape older Sui apps reject with 0x8.
const ADDRESS_BALANCE_TX_B64 =
  "AAACACBvsh/urQJ9pIcyla/1sTzYY/hdvovvz57de8dlGOzHiAIAAMqaOwAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEY29pbgxyZWRlZW1fZnVuZHMBBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAQEBAAEBAwAAAAABAADXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0wDXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0+gDAAAAAAAAAOH1BQAAAAAA";
const ADDRESS_BALANCE_SENDER = "0xd780927da8e7ff96db0399f16738bbce965eef933d487f0465c532bd1eedb0d3";

/** A Hashi deposit PTB: utxo_id, utxo, then deposit with the shared Hashi object and the clock. */
function hashiDepositTransaction(): SuiTransaction {
  const tx = new SuiTransaction();
  const hashi = tx.sharedObjectRef({
    objectId: HASHI_OBJECT,
    initialSharedVersion: "1",
    mutable: true,
  });
  const clock = tx.sharedObjectRef({ objectId: "0x6", initialSharedVersion: "1", mutable: false });
  const [utxoId] = tx.moveCall({
    target: `${HASHI_PACKAGE}::utxo::utxo_id`,
    arguments: [tx.pure.address(`0x${"ab".repeat(32)}`), tx.pure.u32(0)],
  });
  const [utxo] = tx.moveCall({
    target: `${HASHI_PACKAGE}::utxo::utxo`,
    arguments: [utxoId, tx.pure.u64(100000), tx.pure.option("address", SENDER)],
  });
  tx.moveCall({
    target: `${HASHI_PACKAGE}::deposit::deposit`,
    arguments: [hashi, utxo, clock],
  });
  return tx;
}

const account = {
  id: `js:2:sui:${SENDER}:sui`,
  freshAddress: SENDER,
  freshAddressPath: "44'/784'/0'/0'/0'",
  currency: { id: "sui", family: "sui" },
} as unknown as SuiAccount;

const mockSuiSigner = {} as SuiSigner;
const mockSignTransaction = jest.fn();
const findTokenByAddressInCurrency = jest.fn();

let signerContext: jest.Mock;
let coinTypes: string[];

const sign = (
  transaction: string,
  overrides: { account?: SuiAccount; broadcast?: boolean; deviceModelId?: string } = {},
) =>
  buildSignRawOperation(signerContext as unknown as SignerContext<SuiSigner>)({
    account: overrides.account ?? account,
    deviceId: "device",
    transaction,
    broadcast: overrides.broadcast ?? false,
    ...(overrides.deviceModelId ? { deviceModelId: overrides.deviceModelId as never } : {}),
  });

const run = (...args: Parameters<typeof sign>) => lastValueFrom(sign(...args).pipe(toArray()));

const signedEvent = (events: SignOperationEvent[]) => {
  const event = events.find(e => e.type === "signed");
  if (event?.type !== "signed") throw new Error("no signed event");
  return event.signedOperation;
};

/** The transaction bytes the device was asked to sign. */
const bytesSentToDevice = (): Uint8Array => mockSignTransaction.mock.calls[0][0];

beforeAll(() => {
  coinConfig.setCoinConfig(() => ({
    status: { type: "active" },
    node: {
      graphqlUrl: "https://graphql.mainnet.sui.io/graphql",
      grpcUrl: "https://fullnode.mainnet.sui.io:443",
    },
    features: { transport: "grpc" },
    name: "Sui",
    unit: { name: "Sui", code: "SUI", magnitude: 9 },
  }));
  setCryptoAssetsStore({
    findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
      findTokenByAddressInCurrency(address, currencyId),
    findTokenById: async () => undefined,
    getTokensSyncHash: async () => "0",
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  coinTypes = [];
  mockSignTransaction.mockResolvedValue({ signature: SERIALIZED_SIGNATURE });
  (LedgerSigner.fromDerivationPath as jest.Mock).mockResolvedValue({
    signTransaction: mockSignTransaction,
  });
  signerContext = jest.fn((_deviceId: string, fn: (signer: SuiSigner) => Promise<unknown>) =>
    fn(mockSuiSigner),
  );
  // Stands in for the network: resolves only what the dApp left unset, like the SDK does.
  mockBuildRawTransaction.mockImplementation(async (_config, tx) => {
    const { gasData } = tx.getData();
    if (!gasData.price) tx.setGasPrice(1000);
    if (!gasData.budget) tx.setGasBudget(50_000_000);
    if (!gasData.payment?.length) tx.setGasPayment([GAS_COIN]);
    return { serialized: await tx.build(), bcsObjects: [new Uint8Array([9])], coinTypes };
  });
  findTokenByAddressInCurrency.mockResolvedValue(undefined);
});

describe("buildSignRawOperation", () => {
  describe("transaction input", () => {
    it("fills in the sender and gas of an unresolved JSON transaction, then signs", async () => {
      const json = await hashiDepositTransaction().toJSON();

      const events = await run(json);

      expect(events.map(e => e.type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
      const data = SuiTransaction.from(bytesSentToDevice()).getData();
      expect(data.sender).toBe(SENDER);
      expect(data.gasData).toMatchObject({ price: "1000", budget: "50000000" });
      expect(data.gasData.payment).toEqual([GAS_COIN]);
      expect(data.commands.map(c => c.$kind)).toEqual(["MoveCall", "MoveCall", "MoveCall"]);
      expect(mockSignTransaction.mock.calls[0][1]).toEqual([new Uint8Array([9])]);
    });

    it("signs the exact bytes of a fully built base64 BCS transaction", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender(SENDER);
      tx.setGasPrice(1000);
      tx.setGasBudget(50_000_000);
      tx.setGasPayment([GAS_COIN]);
      const bytes = await tx.build();

      await run(toBase64(bytes));

      expect(Array.from(bytesSentToDevice())).toEqual(Array.from(bytes));
    });

    it("keeps the gas owner and gas payment a sponsor set", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender(SENDER);
      tx.setGasOwner(SPONSOR);
      tx.setGasPrice(1000);
      tx.setGasBudget(50_000_000);
      tx.setGasPayment([SPONSOR_GAS_COIN]);

      await run(await tx.toJSON());

      const { gasData } = SuiTransaction.from(bytesSentToDevice()).getData();
      expect(gasData.owner).toBe(SPONSOR);
      expect(gasData.payment).toEqual([SPONSOR_GAS_COIN]);
    });

    it.each([
      ["JSON that does not parse", "{ not json"],
      ["JSON that is not a transaction", '{"version": 2, "inputs": "nope"}'],
      ["bytes that are not a transaction", toBase64(new Uint8Array([1, 2, 3]))],
      ["text that is not base64", "!!! not base64 !!!"],
    ])("rejects %s as an invalid transaction", async (_name, input) => {
      const error = await run(input).catch(e => e);

      expect(error).toBeInstanceOf(SuiRawTransactionInvalid);
      expect(error.cause).not.toBeUndefined();
      expect(mockBuildRawTransaction).not.toHaveBeenCalled();
      expect(signerContext).not.toHaveBeenCalled();
    });
  });

  describe("sender and sponsor checks", () => {
    it("rejects a sender other than the account before any network or device call", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender(OTHER_ADDRESS);

      await expect(run(await tx.toJSON())).rejects.toBeInstanceOf(SuiRawTransactionSenderMismatch);

      expect(mockBuildRawTransaction).not.toHaveBeenCalled();
      expect(signerContext).not.toHaveBeenCalled();
    });

    it("accepts the account address written in short form", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender("0x1");
      const shortAccount = {
        ...account,
        freshAddress: `0x${"0".repeat(63)}1`,
      } as SuiAccount;

      const events = await run(await tx.toJSON(), { account: shortAccount });

      expect(events.at(-1)?.type).toBe("signed");
    });

    it("rejects broadcasting a sponsored transaction before any network or device call", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender(SENDER);
      tx.setGasOwner(SPONSOR);

      await expect(run(await tx.toJSON(), { broadcast: true })).rejects.toBeInstanceOf(
        SuiSponsoredTransactionBroadcastUnsupported,
      );

      expect(mockBuildRawTransaction).not.toHaveBeenCalled();
      expect(signerContext).not.toHaveBeenCalled();
    });

    it("still broadcasts when the account pays for its own gas", async () => {
      const tx = hashiDepositTransaction();
      tx.setSender(SENDER);
      tx.setGasOwner(SENDER);

      const events = await run(await tx.toJSON(), { broadcast: true });

      expect(events.at(-1)?.type).toBe("signed");
    });
  });

  describe("resolution failures", () => {
    it("wraps a network build failure with its cause", async () => {
      const cause = new Error("object not found");
      mockBuildRawTransaction.mockRejectedValue(cause);

      const error = await run(await hashiDepositTransaction().toJSON()).catch(e => e);

      expect(error).toBeInstanceOf(SuiRawTransactionResolutionFailed);
      expect(error.cause).toBe(cause);
      expect(signerContext).not.toHaveBeenCalled();
    });
  });

  describe("clear-signing token descriptor", () => {
    const HBTC_SHORT = HBTC_COIN_TYPE;

    it("loads the descriptor when exactly one coin type is in the CAL", async () => {
      coinTypes = [HBTC_SHORT];
      findTokenByAddressInCurrency.mockResolvedValue(HBTC_TOKEN);

      await run(await hashiDepositTransaction().toJSON(), { deviceModelId: "flex" });

      expect(findTokenByAddressInCurrency).toHaveBeenCalledWith(toLongStructTag(HBTC_SHORT), "sui");
      expect(mockSignTransaction.mock.calls[0][2]).toEqual({
        deviceModelId: "flex",
        certificateSignatureKind: undefined,
        tokenId: HBTC_TOKEN.id,
        tokenAddress: HBTC_SHORT,
      });
    });

    it("sends no descriptor when only SUI is moved", async () => {
      coinTypes = [];

      await run(await hashiDepositTransaction().toJSON());

      expect(findTokenByAddressInCurrency).not.toHaveBeenCalled();
      expect(mockSignTransaction.mock.calls[0][2]).toBeUndefined();
    });

    it("sends no descriptor when the coin type is not in the CAL", async () => {
      coinTypes = [HBTC_SHORT];

      await run(await hashiDepositTransaction().toJSON());

      expect(findTokenByAddressInCurrency).toHaveBeenCalledTimes(1);
      expect(mockSignTransaction.mock.calls[0][2]).toBeUndefined();
    });

    it("sends no descriptor when several coin types are moved", async () => {
      coinTypes = [HBTC_SHORT, "0xabc::other::OTHER"];
      findTokenByAddressInCurrency.mockResolvedValue(HBTC_TOKEN);

      await run(await hashiDepositTransaction().toJSON());

      expect(findTokenByAddressInCurrency).not.toHaveBeenCalled();
      expect(mockSignTransaction.mock.calls[0][2]).toBeUndefined();
    });
  });

  describe("signed result", () => {
    it("returns the hex of the BCS SenderSignedData holding the signed bytes and signature", async () => {
      const events = await run(await hashiDepositTransaction().toJSON());

      const { signature, rawData } = signedEvent(events);
      const [signed] = bcs.SenderSignedData.parse(fromHex(signature));
      expect(
        Array.from(bcs.TransactionData.serialize(signed.intentMessage.value).toBytes()),
      ).toEqual(Array.from(bytesSentToDevice()));
      expect(signed.intentMessage.intent).toMatchObject({
        scope: { TransactionData: true },
        version: { V0: true },
        appId: { Sui: true },
      });
      expect(signed.txSignatures).toEqual([SERIALIZED_SIGNATURE]);
      expect(rawData).toEqual({
        unsigned: toBase64(bytesSentToDevice()),
        serializedSignature: SERIALIZED_SIGNATURE,
      });
    });

    it("attaches a placeholder operation, since only the dApp knows the intent", async () => {
      const events = await run(await hashiDepositTransaction().toJSON());

      expect(signedEvent(events).operation).toMatchObject({
        hash: "",
        type: "OUT",
        accountId: account.id,
        senders: [SENDER],
        recipients: [],
      });
      expect(signedEvent(events).operation.value.toFixed()).toBe("0");
      expect(signedEvent(events).operation.fee.toFixed()).toBe("0");
    });
  });

  describe("device errors", () => {
    it("asks for a Sui app update when the app rejects an address-balance spend", async () => {
      mockBuildRawTransaction.mockResolvedValue({
        serialized: fromBase64(ADDRESS_BALANCE_TX_B64),
        bcsObjects: [],
        coinTypes: [],
      });
      mockSignTransaction.mockRejectedValue(
        Object.assign(new Error("UNKNOWN_ERROR (0x8)"), {
          name: "TransportStatusError",
          statusCode: 0x0008,
        }),
      );
      const addressBalanceAccount = {
        ...account,
        freshAddress: ADDRESS_BALANCE_SENDER,
      } as SuiAccount;

      await expect(
        run(ADDRESS_BALANCE_TX_B64, { account: addressBalanceAccount }),
      ).rejects.toBeInstanceOf(SuiAddressBalanceAppUpdateRequired);
    });

    it("passes any other device error through", async () => {
      const refused = Object.assign(new Error("denied"), { name: "UserRefusedOnDevice" });
      mockSignTransaction.mockRejectedValue(refused);

      await expect(run(await hashiDepositTransaction().toJSON())).rejects.toBe(refused);
    });
  });

  describe("cancellation", () => {
    it("emits no signed event when unsubscribed before the device answers", async () => {
      let answer: (value: { signature: string }) => void = () => {};
      mockSignTransaction.mockReturnValue(new Promise(resolve => (answer = resolve)));
      const events: SignOperationEvent[] = [];
      const subscription = sign(await hashiDepositTransaction().toJSON()).subscribe(e =>
        events.push(e),
      );
      while (mockSignTransaction.mock.calls.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      subscription.unsubscribe();
      answer({ signature: SERIALIZED_SIGNATURE });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(events.map(e => e.type)).toEqual(["device-signature-requested"]);
    });

    it("never opens the device when unsubscribed while the transaction is being built", async () => {
      let build: () => void = () => {};
      const built = new Promise<void>(resolve => (build = resolve));
      const implementation = mockBuildRawTransaction.getMockImplementation();
      if (!implementation) throw new Error("no buildRawTransaction mock");
      mockBuildRawTransaction.mockImplementation(async (...args) => {
        await built;
        return implementation(...args);
      });
      const events: SignOperationEvent[] = [];
      const subscription = sign(await hashiDepositTransaction().toJSON()).subscribe(e =>
        events.push(e),
      );
      while (mockBuildRawTransaction.mock.calls.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      subscription.unsubscribe();
      build();
      await new Promise(resolve => setTimeout(resolve, 0));
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(signerContext).not.toHaveBeenCalled();
      expect(events).toEqual([]);
    });
  });
});
