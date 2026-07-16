import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { buildSignOperation } from "./signOperation";
import { Transaction, FilecoinSigner } from "../types";

jest.mock("@ledgerhq/logs");

jest.mock("iso-filecoin/message", () => ({
  Message: class {
    serialize(): Uint8Array {
      return new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    }
  },
}));

jest.mock("../network", () => ({
  validateAddress: (input: string) => ({
    isValid: input !== "INVALID",
    parsedAddress: { toString: () => input },
  }),
}));

jest.mock("../erc20/tokenAccounts", () => ({
  encodeTxnParams: (_data: string) => "encoded-params",
}));

const ATTO_PER_FIL = new BigNumber(10).pow(18);

function makeAccount(): Account {
  return {
    id: "js:2:filecoin:f1sender:glif",
    freshAddress: "f1sender",
    freshAddressPath: "44'/461'/0'/0/0",
    subAccounts: [],
  } as unknown as Account;
}

function makeTx(fil: number): Transaction {
  return {
    family: "filecoin",
    recipient: "f1recipient",
    amount: new BigNumber(fil).times(ATTO_PER_FIL),
    method: 0,
    version: 0,
    nonce: 6,
    gasLimit: new BigNumber(1516578),
    gasFeeCap: new BigNumber(854792),
    gasPremium: new BigNumber(199489),
  } as unknown as Transaction;
}

function collect<T>(obs: Observable<T>): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const events: T[] = [];
    obs.subscribe({
      next: e => events.push(e),
      error: reject,
      complete: () => resolve(events),
    });
  });
}

const mockSign = jest.fn();
const signerContext = ((_deviceId: string, fn: (signer: FilecoinSigner) => unknown) =>
  fn({ sign: mockSign } as unknown as FilecoinSigner)) as unknown as SignerContext<FilecoinSigner>;

describe("buildSignOperation (legacy bridge)", () => {
  beforeEach(() => {
    mockSign.mockReset();
    mockSign.mockResolvedValue({ signature_compact: new Uint8Array([1, 2, 3]) });
  });

  // Regression test for LIVE-31661 (broadcast rejects exponential BigNumber strings at ≥ 1e21 attoFIL)
  it.each([
    [999, "999000000000000000000"],
    [1000, "1000000000000000000000"],
    [1001, "1001000000000000000000"],
  ])(
    "emits broadcast value for %i FIL as a plain integer, not exponential",
    async (fil, expected) => {
      const events = await collect(
        buildSignOperation(signerContext)({
          account: makeAccount(),
          deviceId: "device-1",
          transaction: makeTx(fil),
        }),
      );

      const signed = events.find(e => e.type === "signed") as
        | { signedOperation: { rawData: { value: string } } }
        | undefined;
      expect(signed?.signedOperation.rawData.value).toBe(expected);
      expect(signed?.signedOperation.rawData.value).not.toMatch(/e/i);
    },
  );

  it("streams the device-signature event sequence in order", async () => {
    const events = await collect(
      buildSignOperation(signerContext)({
        account: makeAccount(),
        deviceId: "device-1",
        transaction: makeTx(1000),
      }),
    );

    expect(events.map(e => e.type)).toEqual([
      "device-signature-requested",
      "device-signature-granted",
      "signed",
    ]);
  });
});
