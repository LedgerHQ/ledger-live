import {
  AccountAddress,
  ChainId,
  RawTransaction,
  Serializable,
  generateSigningMessageForTransaction,
  generateSignedTransaction,
} from "@aptos-labs/ts-sdk";
import { createFixtureAccount } from "../../bridge/bridge.fixture";
import { signTransaction } from "../../network";

jest.mock("@aptos-labs/ts-sdk", () => {
  const originalModule = jest.requireActual("@aptos-labs/ts-sdk");
  const partialMockedModule = Object.keys(originalModule).reduce(
    (pre: { [key: string]: jest.Mock }, methodName) => {
      pre[methodName] = jest.fn();
      return pre;
    },
    {} as { [key: string]: jest.Mock },
  );
  return {
    ...partialMockedModule,
    // mock all except these
    AccountAddress: originalModule.AccountAddress,
    Hex: originalModule.Hex,
  };
});
let mockedGenerateSigningMessageForTransaction: jest.Mocked<any>;
let mockedGenerateSignedTransaction: jest.Mocked<any>;

describe("signTransaction", () => {
  beforeAll(() => {
    mockedGenerateSigningMessageForTransaction = jest.mocked(generateSigningMessageForTransaction);
    mockedGenerateSignedTransaction = jest.mocked(generateSignedTransaction);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should throw an error", async () => {
    mockedGenerateSigningMessageForTransaction.mockReturnValue("signingMessage");

    const mockGenerateSignedTransactionSpy = jest.spyOn(
      { generateSignedTransaction: mockedGenerateSignedTransaction },
      "generateSignedTransaction",
    );

    const signerContext = jest.fn().mockImplementation(() => ({ signature: "0x7aa193705193f4" }));
    const account = createFixtureAccount();
    const deviceId = "nanoX";
    const rawTxn = new RawTransaction(
      new AccountAddress(Uint8Array.from(Buffer.from("thisaddressmustbe32byteslooooong"))),
      BigInt(1),
      "" as unknown as Serializable,
      BigInt(100),
      BigInt(50),
      BigInt(1),
      { chainId: 1 } as ChainId,
    );

    expect(signTransaction(signerContext, account, deviceId, rawTxn)).rejects.toThrow(
      "Account must have a public signing key",
    );

    expect(mockGenerateSignedTransactionSpy).toHaveBeenCalledTimes(0);
  });

  it("should sign a transaction", async () => {
    mockedGenerateSigningMessageForTransaction.mockReturnValue("signingMessage");

    const mockGenerateSignedTransactionSpy = jest.spyOn(
      { generateSignedTransaction: mockedGenerateSignedTransaction },
      "generateSignedTransaction",
    );

    const signerContext = jest.fn().mockImplementation(() => ({ signature: "0x7aa193705193f4" }));
    const account = createFixtureAccount();
    account.xpub = "0xb69a68cc64f7aa193705193f4dd598320a0a74baf7e4b50c9980c5bd60a82390";
    const deviceId = "nanoX";
    const rawTxn = new RawTransaction(
      AccountAddress.fromString(account.xpub),
      BigInt(1),
      "" as unknown as Serializable,
      BigInt(100),
      BigInt(50),
      BigInt(1),
      { chainId: 1 } as ChainId,
    );

    await signTransaction(signerContext, account, deviceId, rawTxn);

    expect(mockGenerateSignedTransactionSpy).toHaveBeenCalledTimes(1);
  });
});
