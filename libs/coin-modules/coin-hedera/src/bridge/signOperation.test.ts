import hederaCoinConfig from "../config";
import { craftTransaction } from "../logic/craftTransaction";
import { combine } from "../logic/combine";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import { buildSignOperation } from "./signOperation";

jest.mock("../logic/craftTransaction", () => ({
  craftTransaction: jest.fn(),
}));

jest.mock("../logic/combine", () => ({
  combine: jest.fn(),
}));

jest.mock("../logic/utils", () => ({
  serializeSignature: jest.fn(() => "serialized-signature"),
  serializeTransaction: jest.fn(() => "serialized-transaction"),
  getHederaTransactionBodyBytes: jest.fn(() => new Uint8Array([1, 2, 3])),
  isTokenAssociateTransaction: jest.fn(() => false),
  isStakingTransaction: jest.fn(() => false),
  safeParseAccountId: jest.fn(async (value: string) => [undefined, { accountId: value }]),
}));

describe("signOperation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes hedera coin config to craftTransaction", async () => {
    const account = getMockedAccount();
    const transaction = getMockedTransaction();
    const config = getMockedConfig();

    jest.spyOn(hederaCoinConfig, "getCoinConfig").mockReturnValue(config);
    jest
      .mocked(craftTransaction)
      .mockResolvedValue({ tx: {} as never, serializedTx: "serialized-tx" });
    jest.mocked(combine).mockReturnValue("combined-signature");

    const signerContext = jest.fn(
      async (_deviceId: string, fn: (signer: any) => Promise<string>) => {
        const signer = {
          signTransaction: jest.fn(async () => new Uint8Array([9, 9, 9])),
        };

        return await fn(signer);
      },
    );

    const signOperation = buildSignOperation(signerContext as never);

    await new Promise<void>((resolve, reject) => {
      signOperation({ account, transaction, deviceId: "test-device" }).subscribe({
        complete: () => resolve(),
        error: err => reject(err),
      });
    });

    expect(hederaCoinConfig.getCoinConfig).toHaveBeenCalledTimes(1);
    expect(hederaCoinConfig.getCoinConfig).toHaveBeenCalledWith(account.currency.id);
    expect(craftTransaction).toHaveBeenCalledTimes(1);
    expect(craftTransaction).toHaveBeenCalledWith({
      txIntent: expect.any(Object),
      config,
    });
    expect(combine).toHaveBeenCalledTimes(1);
  });
});
