import { Hex, type InputEntryFunctionData, RawTransaction, Deserializer } from "@aptos-labs/ts-sdk";
import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from "../../api";
import type { TransactionOptions } from "../../types";
import type { AptosAsset, AptosExtra, AptosSender } from "../../types/assets";
import { AptosAPI } from "../../network";

jest.mock("../../network");
let mockedAptosApi: jest.Mocked<any>;

jest.mock("../../config", () => ({
  setCoinConfig: jest.fn(),
}));

describe("returns a valid transaction", () => {
  beforeEach(() => {
    mockedAptosApi = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("creates a valid transaction", async () => {
    const SENDER_ADDR = "APTOS_1_ADDRESS";
    const RECIPIENT_ADDR = "APTOS_2_ADDRESS";

    const hexRawTx =
      "0xfdde1012c0fac1f9a121eb3c8481c90d473df1c4180c070bd4f2549a6d06180400000000000000000200000000000000000000000000000000000000000000000000000000000000010d6170746f735f6163636f756e74087472616e736665720002203f5f0fcc8a909f23806e5efbdc1757e653fcd744de516a7de12b99b8417925c1080a00000000000000400d03000000000064000000000000002c721b6800000000b7";
    const rawTxn = RawTransaction.deserialize(
      new Deserializer(Hex.fromHexString(hexRawTx).toUint8Array()),
    );

    const mockGenerateTransaction = jest
      .fn()
      .mockImplementation(
        (_address: string, _payload: InputEntryFunctionData, _options: TransactionOptions) =>
          Promise.resolve(rawTxn),
      );
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
    }));
    const mockGenerateTransactionSpy = jest.spyOn(
      { generateTransaction: mockGenerateTransaction },
      "generateTransaction",
    );

    const SENDER: AptosSender = {
      xpub: "public-key",
      freshAddress: SENDER_ADDR,
    };
    const api = createApi({
      aptosSettings: {},
    });

    const txArg: TransactionIntent<AptosAsset, AptosExtra, AptosSender> = {
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT_ADDR,
      amount: 10n,
      asset: { type: "native" },
    };

    const tx = await api.craftTransaction(txArg);

    expect(tx).not.toEqual("");
    expect(Hex.isValid(tx).valid).toBeTruthy();
    expect(mockGenerateTransactionSpy).toHaveBeenCalledTimes(1);
  });
});
