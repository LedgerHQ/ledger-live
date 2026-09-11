import BigNumber from "bignumber.js";
import { craftTransaction } from "../craftTransaction";
import * as buildAccount from "../buildAccount";
import * as candidate from "../buildCandidateTx";
import type { BitcoinContext } from "../../api/config";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";

// craftTransaction takes the full TransactionIntent; the tests only set the fields it reads.
const asIntent = (o: Record<string, unknown>) =>
  o as unknown as Parameters<typeof craftTransaction>[2];

jest.mock("../buildAccount", () => {
  const actual = jest.requireActual("../buildAccount");
  return { ...actual, buildSyncedAccount: jest.fn() };
});
jest.mock("../buildCandidateTx");
jest.mock("../../knownAddressDerivations", () => ({
  buildKnownAddressDerivationsMap: jest.fn(
    async () => new Map([["hash", { pubkey: Buffer.alloc(33), path: [84, 0, 0, 0, 0] }]]),
  ),
}));
jest.mock("bitcoinjs-lib", () => {
  const inst = { addInput: jest.fn(), addOutput: jest.fn(), toBase64: () => "PSBT_BASE64" };
  return { Psbt: jest.fn(() => inst), __inst: inst };
});

const mockedBuild = buildAccount.buildSyncedAccount as jest.MockedFunction<
  typeof buildAccount.buildSyncedAccount
>;
const mockedCandidate = candidate.buildCandidateTx as jest.MockedFunction<
  typeof candidate.buildCandidateTx
>;
const psbtInst = (
  jest.requireMock("bitcoinjs-lib") as { __inst: { addInput: jest.Mock; addOutput: jest.Mock } }
).__inst;
const context = {} as unknown as BitcoinContext;

// Account whose explorer quotes a single "3" target → median network rate = ceil(3000/1000) = 3 sat/vB.
const accountMock = {
  xpub: {
    crypto: { toOutputScript: () => Buffer.from("0014abcdef", "hex") },
    explorer: { getFees: async () => ({ "3": 3000, last_updated: 1 }) },
  },
} as unknown as Awaited<ReturnType<typeof buildAccount.buildSyncedAccount>>;

const segwitTxInfo = {
  fee: 1000,
  associatedDerivations: [[0, 0]],
  inputs: [
    {
      output_hash: "aa",
      output_index: 0,
      sequence: 0xffffffff,
      value: "50000",
      address: "bc1qsender",
      txHex: "00",
    },
  ],
  outputs: [
    {
      script: Buffer.from("0014abcdef", "hex"),
      value: new BigNumber(49000),
      address: "bc1qdest",
      isChange: false,
    },
  ],
  changeAddress: { account: 1, index: 0, address: "bc1qchange" },
} as unknown as Awaited<ReturnType<typeof candidate.buildCandidateTx>>;

describe("logic/craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("serializes a coin-selected native-segwit tx into a PSBT with wallet-policy details", async () => {
    mockedBuild.mockResolvedValue(accountMock);
    mockedCandidate.mockResolvedValue(segwitTxInfo);

    const result = await craftTransaction(
      context,
      "bitcoin",
      asIntent({
        sender: "zpub",
        recipient: "bc1qdest",
        amount: 49000n,
        senderDerivationPath: "84'/0'/0'",
      }),
    );

    expect(result.transaction).toBe("PSBT_BASE64");
    expect(result.details?.accountPath).toBe("84'/0'/0'");
    expect(result.details?.addressFormat).toBe("bech32");
    expect(result.details?.fee).toBe(1000);
    expect(result.details?.knownAddressDerivations).toBeInstanceOf(Map);
    // segwit input → witnessUtxo path
    expect(psbtInst.addInput).toHaveBeenCalledTimes(1);
    expect(psbtInst.addInput.mock.calls[0][0]).toHaveProperty("witnessUtxo");
    expect(psbtInst.addOutput).toHaveBeenCalledTimes(1);
    // no custom fee → coin-selects at the network-estimated median rate (3 sat/vB)
    expect(mockedCandidate).toHaveBeenCalledWith(accountMock, "bc1qdest", 49000n, 3, undefined);
  });

  it("coin-selects at the user-provided fee rate when customFees overrides it", async () => {
    mockedBuild.mockResolvedValue(accountMock);
    mockedCandidate.mockResolvedValue(segwitTxInfo);

    const customFees = { value: 0n, parameters: { feePerByte: 25 } } as unknown as FeeEstimation;
    await craftTransaction(
      context,
      "bitcoin",
      asIntent({
        sender: "zpub",
        recipient: "bc1qdest",
        amount: 49000n,
        senderDerivationPath: "84'/0'/0'",
      }),
      customFees,
    );

    // 25 sat/vB from customFees.parameters, NOT the network median (3)
    expect(mockedCandidate).toHaveBeenCalledWith(accountMock, "bc1qdest", 49000n, 25, undefined);
  });
});
