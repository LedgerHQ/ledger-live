import { BadResponseError, Horizon } from "@stellar/stellar-sdk";
import coinConfig from "../config";
import { broadcastTransaction } from "./horizon";

/** Parses on mainnet; used only so `submitTransaction` is reached (mocked). */
const tx =
  "AAAAAgAAAABRUCgFba+DTbei2ifpyYt5w2Hh0VyZ+X9fayjIDne7YAAAAGQCkDOGAAAABQAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAQAAAACEIuPfWXgM8WhyqjrpFdIcGV1SUVhMzPUm4YspNHF60QAAAAAAAAAAALkd2QAAAAAAAAABDne7YAAAAEAASzsT/yDIfCfEDstkfnznXjiN7rNd7PkKQEn+rRIFm9EHoirGfHipWoBdYMrc6ixQD/0y0of1piSid8TLiFAB";

function horizonTransactionFailedExtras() {
  return {
    type: "https://stellar.org/horizon-errors/transaction_failed",
    title: "Transaction Failed",
    status: 400,
    detail: "The transaction failed when submitted to the stellar network.",
    extras: {
      result_codes: {
        transaction: "tx_failed" as const,
        operations: ["op_no_account"] as string[],
      },
      result_xdr: "AAAAAAAAAGT////4AAAAAA==",
      envelope_xdr: tx,
    },
  };
}

describe("broadcastTransaction", () => {
  let submitTransactionSpy: jest.SpiedFunction<Horizon.Server["submitTransaction"]>;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      explorer: { url: "https://horizon-broadcast-unit-test.invalid/" },
      status: { type: "active" },
    }));
  });

  beforeEach(() => {
    submitTransactionSpy = jest
      .spyOn(Horizon.Server.prototype, "submitTransaction")
      .mockRejectedValue(new Error("mock not configured"));
  });

  afterEach(() => {
    submitTransactionSpy.mockRestore();
  });

  it("maps BadResponseError with Horizon body on error.response to StellarBroadcastFailedError", async () => {
    const body = horizonTransactionFailedExtras();
    submitTransactionSpy.mockRejectedValue(
      new BadResponseError(
        "Transaction submission failed. Server responded: 400 Bad Request",
        body,
      ),
    );

    await expect(broadcastTransaction(tx)).rejects.toMatchObject({
      name: "StellarBroadcastFailedError",
      horizonTransactionCode: "tx_failed",
      cause: expect.any(BadResponseError),
    });
  });

  it("maps axios-like error with Horizon body on error.response.data to StellarBroadcastFailedError", async () => {
    const body = horizonTransactionFailedExtras();
    submitTransactionSpy.mockRejectedValue(
      Object.assign(new Error("Request failed with status code 400"), {
        name: "AxiosError",
        response: { status: 400, statusText: "Bad Request", data: body },
      }),
    );

    await expect(broadcastTransaction(tx)).rejects.toMatchObject({
      name: "StellarBroadcastFailedError",
      horizonTransactionCode: "tx_failed",
      cause: expect.objectContaining({ name: "AxiosError" }),
    });
  });

  it("rethrows a plain error with no Horizon payload unchanged (same reference)", async () => {
    const original = new Error("ECONNREFUSED");
    submitTransactionSpy.mockRejectedValue(original);

    await expect(broadcastTransaction(tx)).rejects.toBe(original);
  });

  it("rethrows an axios-like error when response.data is not a Horizon transaction failure body", async () => {
    const original = Object.assign(new Error("Request failed with status code 500"), {
      name: "AxiosError",
      response: {
        status: 500,
        statusText: "Internal Server Error",
        data: { title: "Internal Server Error" },
      },
    });
    submitTransactionSpy.mockRejectedValue(original);

    await expect(broadcastTransaction(tx)).rejects.toBe(original);
  });
});
