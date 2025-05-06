
import {
  type ChainId,
  Hex,
  type InputEntryFunctionData,
  RawTransaction,
  type Serializable,
  AccountAddress,
} from "@aptos-labs/ts-sdk";
import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from "../../api";
import type { TransactionOptions } from "../../types";
import type { AptosAsset, AptosExtra, AptosSender } from "../../types/assets";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../../constants";
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
    // const account1 = AccountAddress.fromString("APTOS_1_ADDRESS");
    // console.log(account1);
    const SENDER_ADDR = "APTOS_1_ADDRESS";
    const RECIPIENT_ADDR = "APTOS_2_ADDRESS";
    // const amount = BigNumber(10);
    // const payload: InputEntryFunctionData = {
    //     function: "0x1::aptos_account::transfer_coins",
    //     typeArguments: [APTOS_ASSET_ID],
    //     functionArguments: [RECIPIENT.toString(), amount.toString()],
    //   };

    const rawTxn = new RawTransaction(
      new AccountAddress(Uint8Array.from(Buffer.from("thisaddressmustbe32byteslooooong"))),
      BigInt(1),
      "" as unknown as Serializable,
      BigInt(DEFAULT_GAS.toString()),
      BigInt(DEFAULT_GAS_PRICE.toString()),
      BigInt(1),
      { chainId: 1 } as ChainId,
    );

    const mockGenerateTransaction = jest.fn().mockImplementation((_address: string, _payload: InputEntryFunctionData, _options: TransactionOptions) => Promise.resolve(rawTxn));
    mockedAptosApi.mockImplementation(() => ({
      generateTransaction: mockGenerateTransaction,
    }));
    const mockGenerateTransactionSpy = jest.spyOn({ generateTransaction: mockGenerateTransaction }, "generateTransaction");

    const SENDER: AptosSender = {
      xpub: "public-key",
      freshAddress: SENDER_ADDR.toString(),
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
    expect(Hex.isValid(tx)).toBeTruthy();
    expect(mockGenerateTransactionSpy).toHaveBeenCalledTimes(1);
  });
});
