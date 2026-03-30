import axios from "axios";
import BigNumber from "bignumber.js";
import { retrieveSwapPayload } from "../actions";

jest.mock("axios");
jest.mock("../../..", () => ({
  getSwapAPIBaseURL: jest.fn(() => "https://swap.ledger.com/v5"),
}));

describe("retrieveSwapPayload", () => {
  const post = jest.fn();
  const mockedAxios = jest.mocked(axios);

  const payloadData = {
    provider: "changelly",
    deviceTransactionId: "tx-id",
    fromAccountAddress: "from-address",
    toAccountAddress: "to-address",
    fromAccountCurrency: "bitcoin",
    toAccountCurrency: "ethereum",
    amount: "1",
    amountInAtomicUnit: new BigNumber("100000000"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue({ post } as never);
    post.mockResolvedValue({
      data: {
        binaryPayload: "binary",
        signature: "signature",
        payinAddress: "payin",
        swapId: "swap-id",
      },
    });
  });

  it("sends x-ledger-client-v4-ux header when wallet40Ux flag is true", async () => {
    await retrieveSwapPayload({ ...payloadData, flags: { wallet40Ux: true } });

    expect(post).toHaveBeenCalledWith(
      "https://swap.ledger.com/v5/swap",
      expect.any(Object),
      expect.objectContaining({
        headers: {
          "x-ledger-client-v4-ux": "true",
        },
      }),
    );
  });

  it("does not send request headers when wallet40Ux flag is missing", async () => {
    await retrieveSwapPayload(payloadData);

    expect(post).toHaveBeenCalledWith(
      "https://swap.ledger.com/v5/swap",
      expect.any(Object),
      undefined,
    );
  });

  it("does not send request headers when wallet40Ux flag is false", async () => {
    await retrieveSwapPayload({ ...payloadData, flags: { wallet40Ux: false } });

    expect(post).toHaveBeenCalledWith(
      "https://swap.ledger.com/v5/swap",
      expect.any(Object),
      undefined,
    );
  });
});
