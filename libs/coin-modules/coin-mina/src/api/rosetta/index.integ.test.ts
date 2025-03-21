import { CurrencyConfig } from "@ledgerhq/coin-framework/lib/config";
import { fetchTransactionMetadata } from ".";
import { getCoinConfig } from "../../config";

jest.mock("../../config");

jest.mocked(getCoinConfig).mockReturnValue({
  ...({} as unknown as CurrencyConfig),
  infra: {
    API_MINA_ROSETTA_NODE: "https://mina.coin.ledger.com/node",
  },
});

describe("get metadata for a transactions", () => {
  it("should get metadata for a transactions", async () => {
    const metadata = await fetchTransactionMetadata(
      "B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLSM",
      "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314",
      10000000,
      10000000,
    );

    expect(metadata).toBeDefined();
    expect(metadata.data.suggested_fee).toHaveLength(1);
  }, 10000);
});
