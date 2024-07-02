import { fetchTransactionMetadata } from ".";
import { setCoinConfig } from "../../config";

setCoinConfig((): any => {
  return {
    infra: {
      API_MINA_ROSETTA_NODE: "https://mina-rosetta-api-devnet.zondax.dev",
    },
  };
});

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
