import { fetchTransactionMetadata } from ".";
import { setConfig } from "../../testUtils";
setConfig();

test("get metadata for a transactions", async () => {
  const metadata = await fetchTransactionMetadata(
    "B62qkdFWJSW8zaTBZjTVtmeU3rVxyUkNxPhKKW8T2JBtpj5XfdywLSM",
    "B62qkWcHhoisWDCR7v3gvWzX6wXEVuGYLHXq3mSym4GEzfYXmSDv314",
    10000000,
    10000000,
  );

  expect(metadata).toBeDefined();
  expect(metadata.data.suggested_fee).toHaveLength(1);
});
