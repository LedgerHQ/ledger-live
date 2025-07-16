import { HORIZON_TEST_BASE_URL } from "./msw-handles.fixture";

const generateFakeTxHash = () => {
  let hash = "";
  const hexChars = "0123456789abcdef";

  for (let i = 0; i < 64; i++) {
    hash += hexChars[Math.floor(Math.random() * 16)];
  }

  return hash;
};

export const generateOperationsList = (address: string, count = 100) => {
  const operations = [];
  for (let i = 0; i < count; i++) {
    const randomId = Math.floor(Math.random() * 1000000000);
    const randomTxHash = generateFakeTxHash();
    const operation = {
      _links: {
        transaction: {
          href: `${HORIZON_TEST_BASE_URL}/transactions/${randomTxHash}`,
        },
      },
      id: randomId.toString(),
      paging_token: randomId.toString(),
      transaction_successful: true,
      source_account: address,
      type: "payment",
      type_i: 1,
      created_at: "2025-03-12T07:13:30Z",
      transaction_hash: randomTxHash,
      asset_type: "native",
      from: address,
      to: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      amount: "1.0000000",
    };
    operations.push(operation);
  }

  return operations;
};
