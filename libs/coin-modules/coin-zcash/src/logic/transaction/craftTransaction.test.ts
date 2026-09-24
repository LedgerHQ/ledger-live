import { craftIronwoodTransaction, craftTransaction } from "./craftTransaction";
import { combine } from "./combine";
import { TEST_ZAINO_ENDPOINT } from "../../test/coinConfig";
import type { CraftPlan, IronwoodCraftPlan } from "./craftTransaction";

const buildTransaction = jest.fn(async () => ({ pcztHex: "01", nActionsOrchard: 2 }));
const buildIronwoodTransaction = jest.fn(async () => ({ pcztHex: "02", nActionsIronwood: 2 }));
const finalizeTransaction = jest.fn(async () => ({ txHex: "raw", txid: "id" }));
const createZCashClient = jest.fn();

jest.mock(
  "@ledgerhq/coin-zcash/network/ZCash",
  () => ({ createZCashClient: (...args: unknown[]) => createZCashClient(...args) }),
  { virtual: true },
);

const client = () => ({ buildTransaction, buildIronwoodTransaction, finalizeTransaction });

const plan: IronwoodCraftPlan = {
  ufvk: "uview1key",
  accountIndex: 0,
  feeZat: "15000",
  spends: [],
  transparentInputs: [],
  outputs: [{ address: "u1recipient", valueZat: "50000" }],
} as unknown as IronwoodCraftPlan;

beforeEach(() => {
  jest.clearAllMocks();
  createZCashClient.mockImplementation(() => client());
});

describe("craftTransaction", () => {
  it("builds a PCZT v1 through the engine, on the endpoint it is given", async () => {
    expect(await craftTransaction(TEST_ZAINO_ENDPOINT, plan)).toEqual({
      pcztHex: "01",
      nActionsOrchard: 2,
    });

    expect(buildTransaction).toHaveBeenCalledWith({
      ...plan,
      ...TEST_ZAINO_ENDPOINT,
      seedFingerprint: "00".repeat(32),
    });
    expect(buildIronwoodTransaction).not.toHaveBeenCalled();
  });

  it("carries the endpoint's network into the build arguments", async () => {
    await craftTransaction({ grpcUrl: "https://testnet.zec.rocks", network: "testnet" }, plan);

    expect(buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ grpcUrl: "https://testnet.zec.rocks", network: "testnet" }),
    );
  });

  it("prefers a caller-supplied seed fingerprint over the placeholder", async () => {
    await craftTransaction(TEST_ZAINO_ENDPOINT, { ...plan, seedFingerprint: "ab".repeat(32) });

    expect(buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ seedFingerprint: "ab".repeat(32) }),
    );
  });

  it("builds a transparent send from the account pubkey alone, with no viewing key", async () => {
    const transparentPlan: CraftPlan = {
      transparentAccountPubkey: "ab".repeat(65),
      accountIndex: 0,
      feeZat: "10000",
      spends: [],
      transparentInputs: [],
      outputs: [{ address: "t1recipient", valueZat: "50000" }],
    } as unknown as CraftPlan;

    await craftTransaction(TEST_ZAINO_ENDPOINT, transparentPlan);

    expect(buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ transparentAccountPubkey: "ab".repeat(65) }),
    );
    expect(buildTransaction).toHaveBeenCalledWith(
      expect.not.objectContaining({ ufvk: expect.anything() }),
    );
  });

  it("reports an engine that cannot build, rather than failing later", async () => {
    createZCashClient.mockImplementation(() => ({ finalizeTransaction }));

    await expect(craftTransaction(TEST_ZAINO_ENDPOINT, plan)).rejects.toThrow(
      "Shielded Zcash transactions are not supported in this environment",
    );
  });
});

describe("craftIronwoodTransaction", () => {
  it("builds through the V6 builder, the only encoding an Ironwood bundle fits in", async () => {
    expect(await craftIronwoodTransaction(TEST_ZAINO_ENDPOINT, plan)).toEqual({
      pcztHex: "02",
      nActionsIronwood: 2,
    });

    expect(buildIronwoodTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ ...plan, network: "mainnet" }),
    );
    expect(buildTransaction).not.toHaveBeenCalled();
  });

  it("reports an engine with no V6 builder", async () => {
    createZCashClient.mockImplementation(() => ({ buildTransaction }));

    await expect(craftIronwoodTransaction(TEST_ZAINO_ENDPOINT, plan)).rejects.toThrow(
      "Zcash V6 (Ironwood) transactions are not supported in this environment",
    );
  });
});

describe("combine", () => {
  const signatures = {
    pczt: "01",
    orchardSignatures: ["aa".repeat(64)],
    transparentSignatures: ["bb".repeat(64)],
  };

  it("injects the device signatures and extracts the signed transaction", async () => {
    expect(await combine(TEST_ZAINO_ENDPOINT, signatures)).toEqual({ txHex: "raw", txid: "id" });
    expect(finalizeTransaction).toHaveBeenCalledWith(signatures);
  });

  it("reports an engine that cannot finalize", async () => {
    createZCashClient.mockImplementation(() => ({ buildTransaction }));

    await expect(combine(TEST_ZAINO_ENDPOINT, signatures)).rejects.toThrow(
      "Shielded Zcash transactions are not supported in this environment",
    );
  });
});
