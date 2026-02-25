import { BigNumber } from "bignumber.js";
import { firstValueFrom, toArray } from "rxjs";
import buildSignOperation from "../../signOperation";
import type { Account, Operation } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Transaction } from "../../types";

// ---- Mocks ---------------------------------------------------------------

jest.mock("../../cache", () => ({
  calculateFees: jest.fn().mockResolvedValue({
    fees: new BigNumber(1000), // 1000 sats
    txInputs: [
      { address: "bc1qsender1..." },
      { address: "bc1qsender2..." },
      { address: "bc1qsender1..." }, // duplicate to test Set behavior
    ],
    txOutputs: [
      { address: "bc1qrecipient...", isChange: false, value: new BigNumber(5000) },
      { address: "bc1qchange...", isChange: true, value: new BigNumber(15000) },
      { address: null, isChange: false, value: new BigNumber(0) },
    ],
  }),
}));

jest.mock("../../buildTransaction", () => ({
  buildTransaction: jest.fn().mockResolvedValue({
    // shape not relevant for test, passed through to wallet.signAccountTx
  }),
}));

jest.mock("../../networks", () => ({
  getNetworkParameters: jest.fn().mockReturnValue({ sigHash: 1 }),
}));

// Wallet mock to capture parameters and simulate device callbacks
jest.mock("../../wallet-btc", () => ({
  __esModule: true,
  default: {
    // will be inspected and controlled via jest.requireMock in tests
    signAccountTx: jest.fn(),
  },
  getWalletAccount: jest.fn().mockReturnValue({
    params: { path: "m/84'/0'/0'", index: 0 },
    xpub: {},
  }),
}));

// Keep derivation helpers deterministic
jest.mock("@ledgerhq/coin-framework/derivation", () => {
  const actual = jest.requireActual("@ledgerhq/coin-framework/derivation");
  return {
    ...actual,
    isSegwitDerivationMode: () => true,
  };
});

// ---- Helpers -------------------------------------------------------------

const makeAccount = (over: Partial<Account> = {}): Account => ({
  id: "js:2:bitcoin:dummy",
  type: "Account",
  used: true,
  operationsCount: 0,
  balanceHistoryCache: {
    HOUR: {
      latestDate: null,
      balances: [],
    },
    DAY: {
      latestDate: null,
      balances: [],
    },
    WEEK: {
      latestDate: null,
      balances: [],
    },
  },
  swapHistory: [],
  freshAddress: "bc1q...",
  freshAddressPath: "m/84'/0'/0'/0/0",
  currency: findCryptoCurrencyById("bitcoin")!,
  derivationMode: "native_segwit",
  seedIdentifier: "seed",
  xpub: "xpub...",
  index: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  blockHeight: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(0),
  creationDate: new Date(0),
  ...over,
});

import type { BitcoinSigner, SignerContext } from "../../signer";

type WalletBtcMock = {
  default: {
    // narrow to the shape we exercise in these tests
    signAccountTx: jest.Mock<
      Promise<string>,
      [
        {
          onDeviceSignatureRequested?: () => void;
          onDeviceSignatureGranted?: () => void;
          onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
        },
      ]
    >;
  };
  getWalletAccount: jest.Mock;
};

const walletBtcMock: WalletBtcMock = jest.requireMock("../../wallet-btc");

const signAccountTx = walletBtcMock.default.signAccountTx;
const getWalletAccount = walletBtcMock.getWalletAccount;

const dummySigner: BitcoinSigner = {
  getWalletXpub: jest.fn(),
  getWalletPublicKey: jest.fn(),
  signMessage: jest.fn(),
  splitTransaction: jest.fn(),
  createPaymentTransaction: jest.fn(),
  signPsbtBuffer: jest.fn(),
};

// SignerContext: (deviceId, currency, fn) => Promise<ReturnType<fn>>
const makeSignerContext = (): SignerContext => (deviceId, currency, fn) => fn(dummySigner);

// -------------------------------------------------------------------------

describe("signOperation (bitcoin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("emits device events and builds optimistic operation from fee data", async () => {
    const signerContext = makeSignerContext();
    const signOperation = buildSignOperation(signerContext);

    // Minimal transaction shape for this test
    const transaction: Transaction = {
      family: "bitcoin",
      amount: new BigNumber(20000),
      recipient: "bc1qrecipient...",
      useAllAmount: false,
      feePerByte: new BigNumber(1),
      networkInfo: null,
      utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      rbf: false,
    };

    // signAccountTx should simulate device callbacks and return a tx hex
    signAccountTx.mockImplementation(
      (params: {
        onDeviceSignatureRequested?: () => void;
        onDeviceSignatureGranted?: () => void;
        onDeviceStreaming?: (arg: { progress: number; index: number; total: number }) => void;
      }) => {
        const { onDeviceSignatureRequested, onDeviceSignatureGranted, onDeviceStreaming } = params;
        if (onDeviceSignatureRequested) {
          onDeviceSignatureRequested();
        }
        if (onDeviceStreaming) {
          onDeviceStreaming({ progress: 50, index: 0, total: 1 });
        }
        if (onDeviceSignatureGranted) {
          onDeviceSignatureGranted();
        }
        return Promise.resolve("01020304");
      },
    );

    const account = makeAccount();

    const events = await firstValueFrom(
      signOperation({ account, deviceId: "mock", transaction }).pipe(toArray()),
    );

    // Events should include requested, streaming and granted
    const types = events.map(e => e.type);
    expect(types).toContain("device-signature-requested");
    expect(types).toContain("device-signature-granted");
    expect(types).toContain("device-streaming");

    const streamingEvt = events.find(e => e.type === "device-streaming");
    expect(streamingEvt).toMatchObject({
      type: "device-streaming",
      progress: 50,
      index: 0,
      total: 1,
    });

    const signedEvt = events.find(e => e.type === "signed");
    if (!signedEvt || signedEvt.type !== "signed") {
      throw new Error("No signed event");
    }
    const { signedOperation } = signedEvt;

    // raw signature checks
    expect(signedOperation.signature).toBe("01020304");

    const op: Operation = signedOperation.operation;
    // fee/value taken from calculateFees mock
    expect(op.fee.toNumber()).toBe(1000);
    expect(op.value.toNumber()).toBe(21000); // amount + fee
    expect(op.senders).toEqual(["bc1qsender1...", "bc1qsender2..."]);
    expect(op.recipients).toEqual(["bc1qrecipient..."]);
    expect(op.accountId).toBe(account.id);
    expect(op.type).toBe("OUT");
    expect(op.date).toBeInstanceOf(Date);

    // Wallet helpers and additionals wiring
    expect(getWalletAccount).toHaveBeenCalledWith(account);
    expect(signAccountTx).toHaveBeenCalledTimes(1);
    const [params] = signAccountTx.mock.calls[0];
    expect(params).toMatchObject({
      sigHashType: 1,
      segwit: true,
      additionals: ["bitcoin", "bech32"], // For bitcoin + native_segwit we expect bech32 flag
    });
  });
});
