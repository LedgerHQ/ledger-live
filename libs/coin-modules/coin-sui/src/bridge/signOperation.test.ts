import buildSignOperation from "./signOperation";

import { BigNumber } from "bignumber.js";

import { SuiSigner, SuiAccount } from "../types";

const createFixtureAccount = () =>
  ({
    id: "dummyAccountId",
    type: "Account",
    seedIdentifier: "seed",
    derivationMode: "",
    index: 0,
    freshAddress: "0x1234567890abcdef",
    freshAddressPath: "44'/784'/0'/0'/0'",
    freshAddresses: [],
    name: "Sui Account",
    starred: false,
    used: true,
    operations: [],
    pendingOperations: [],
    currencyId: "sui",
    unitMagnitude: 9,
    balance: new BigNumber(1000000000000000000),
    spendableBalance: new BigNumber(1000000000000000000),
    blockHeight: 0,
    lastSyncDate: new Date(),
    creationDate: new Date(),
    currency: { id: "sui" },
    operationsCount: 0,
    balanceHistoryCache: {},
    swapHistory: [],
  }) as unknown as SuiAccount;

const createFixtureTransaction = (overrides = {}) => ({
  family: "sui" as const,
  mode: "send",
  recipient: "0xabcdef1234567890",
  amount: new BigNumber(100000000000000000),
  fees: new BigNumber(1000),
  errors: {},
  ...overrides,
});

describe("signOperation", () => {
  // Global setup
  const fakeSignature = new Uint8Array(64).fill(0x42); // Create fakeSignature
  const fakeSigner = {
    getPublicKey: jest.fn().mockResolvedValue({
      publicKey: new Uint8Array(32).fill(0x01),
      address: "0x1234567890abcdef",
    }),
    signTransaction: jest.fn().mockResolvedValue({
      signature: fakeSignature,
    }),
    getVersion: jest.fn().mockResolvedValue({ major: 0, minor: 1, patch: 0 }),
    transport: {} as any,
  } as unknown as SuiSigner;
  const signerContext = <T>(_deviceId: string, fn: (signer: SuiSigner) => Promise<T>) =>
    fn(fakeSigner);
  const signOperation = buildSignOperation(signerContext);
  const deviceId = "dummyDeviceId";

  it("returns events in the right order", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();

    // WHEN & THEN
    const expectedEvent = [
      {
        type: "device-signature-requested",
      },
      {
        type: "device-signature-granted",
      },
      {
        type: "signed",
      },
    ];
    let eventIdx = 0;

    signOperation({ account, deviceId, transaction }).forEach(e => {
      try {
        expect(e.type).toEqual(expectedEvent[eventIdx].type);
        eventIdx++;

        if (eventIdx === expectedEvent.length) {
          done();
        }
      } catch (err) {
        done(err);
      }
    });
  });

  it("throws an error of transaction has no fees", done => {
    // GIVEN
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({ fees: undefined });

    // WHEN & THEN
    const observer = {
      error: (e: Error) => {
        expect(e.name).toMatch("FeeNotLoaded");
        done();
      },
    };
    signOperation({ account, deviceId, transaction }).subscribe(observer);
  });
});
