import { craftIronwoodTransaction, craftTransaction } from "./craftTransaction";
import { combine } from "./combine";
import { setZainoGrpcUrl, ZCASH_GRPC_URL_MAINNET } from "../../constants";
import type { CraftPlan } from "./craftTransaction";

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

const plan: CraftPlan = {
  ufvk: "uview1key",
  accountIndex: 0,
  feeZat: "15000",
  spends: [],
  transparentInputs: [],
  outputs: [{ address: "u1recipient", valueZat: "50000" }],
} as unknown as CraftPlan;

beforeEach(() => {
  jest.clearAllMocks();
  createZCashClient.mockImplementation(() => client());
});

afterEach(() => setZainoGrpcUrl(null));

describe("craftTransaction", () => {
  it("builds a PCZT v1 through the engine, on the endpoint the sync path uses", async () => {
    expect(await craftTransaction(plan)).toEqual({ pcztHex: "01", nActionsOrchard: 2 });

    expect(buildTransaction).toHaveBeenCalledWith({
      ...plan,
      grpcUrl: ZCASH_GRPC_URL_MAINNET,
      network: "mainnet",
      seedFingerprint: "00".repeat(32),
    });
    expect(buildIronwoodTransaction).not.toHaveBeenCalled();
  });

  it("follows an endpoint override, so a send targets the chain that was synced", async () => {
    setZainoGrpcUrl("https://testnet.zec.rocks");

    await craftTransaction(plan);

    expect(buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ grpcUrl: "https://testnet.zec.rocks", network: "testnet" }),
    );
  });

  it("prefers a caller-supplied seed fingerprint over the placeholder", async () => {
    await craftTransaction({ ...plan, seedFingerprint: "ab".repeat(32) });

    expect(buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ seedFingerprint: "ab".repeat(32) }),
    );
  });

  it("reports an engine that cannot build, rather than failing later", async () => {
    createZCashClient.mockImplementation(() => ({ finalizeTransaction }));

    await expect(craftTransaction(plan)).rejects.toThrow(
      "Shielded Zcash transactions are not supported in this environment",
    );
  });
});

describe("craftIronwoodTransaction", () => {
  it("builds through the V6 builder, the only encoding an Ironwood bundle fits in", async () => {
    expect(await craftIronwoodTransaction(plan)).toEqual({ pcztHex: "02", nActionsIronwood: 2 });

    expect(buildIronwoodTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ ...plan, network: "mainnet" }),
    );
    expect(buildTransaction).not.toHaveBeenCalled();
  });

  it("reports an engine with no V6 builder", async () => {
    createZCashClient.mockImplementation(() => ({ buildTransaction }));

    await expect(craftIronwoodTransaction(plan)).rejects.toThrow(
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
    expect(await combine(signatures)).toEqual({ txHex: "raw", txid: "id" });
    expect(finalizeTransaction).toHaveBeenCalledWith(signatures);
  });

  it("reports an engine that cannot finalize", async () => {
    createZCashClient.mockImplementation(() => ({ buildTransaction }));

    await expect(combine(signatures)).rejects.toThrow(
      "Shielded Zcash transactions are not supported in this environment",
    );
  });
});
