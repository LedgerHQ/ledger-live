import { BigNumber } from "bignumber.js";
import buildSignOperation from "./signOperation";
import { SuiSigner, SuiAccount } from "../types";
import coinConfig from "../config";

jest.mock("../config");
const mockGetConfig = jest.mocked(coinConfig.getCoinConfig);

const createFixtureAccount = (overrides = {}) =>
  ({
    type: "Account",
    id: "js:2:sui:0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0:sui",
    used: true,
    seedIdentifier: "99807c4b6e1b8b25120f633f5f7816a393e4d3e7f84bdf24bd8afe725911be91",
    derivationMode: "sui",
    index: 0,
    freshAddress: "0x6e143fe0a8ca010a86580dafac44298e5b1b7d73efc345356a59a15f0d7824f0",
    freshAddressPath: "44'/784'/0'/0'/0'",
    blockHeight: 10,
    creationDate: "2025-03-12T14:48:48.155Z",
    balance: "17997970360",
    spendableBalance: "17997970360",
    operations: [],
    operationsCount: 2,
    pendingOperations: [],
    currency: {
      type: "CryptoCurrency",
      id: "sui",
      coinType: 784,
      name: "Sui",
      managerAppName: "Sui",
      ticker: "SUI",
      scheme: "sui",
      color: "#000",
      family: "sui",
      units: [{ name: "Sui", code: "SUI", magnitude: 9 }],
      explorerViews: [
        {
          tx: "https://suiscan.xyz/mainnet/tx/$hash",
          address: "https://suiscan.xyz/mainnet/account/$address",
        },
        {
          tx: "https://suivision.xyz/txblock/$hash",
          address: "https://suivision.xyz/account/$address",
        },
      ],
    },
    lastSyncDate: "2025-03-13T11:13:06.936Z",
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: {
        balances: [0],
        latestDate: 1741863600000,
      },
      DAY: { balances: [0], latestDate: 1741813200000 },
      WEEK: { balances: [0], latestDate: 1741467600000 },
    },
    subAccounts: [],
    suiResources: { nonce: 0 },
    ...overrides,
  }) as unknown as SuiAccount;

const createFixtureTransaction = (overrides = {}) => ({
  family: "sui" as const,
  mode: "send",
  amount: BigNumber("3000000000"),
  recipient: "0x65449f57946938c84c512732f1d69405d1fce417d9c9894696ddf4522f479e24",
  useAllAmount: false,
  fees: BigNumber("3976000"),
  errors: {},
  skipVerify: true,
  ...overrides,
});

describe("signOperation", () => {
  const fakeSignature = new Uint8Array(64).fill(0x42);
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

  beforeAll(() => {
    mockGetConfig.mockImplementation((): any => {
      return {};
    });
  });

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

    signOperation({ account, deviceId, transaction }).forEach((e: { type: string }) => {
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
