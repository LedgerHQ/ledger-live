import { getTransactions } from "./getTransactions";
import { getAllTransactionsByKeys } from "./fetchTransactions";
import { CardanoAccount } from "../types";

jest.mock("./fetchTransactions");

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
};

const xpub =
  "2b7203eaac6970424a3c03c6523d73d5c5c8608bbdb2da6cac0fa818a550070226ff4d533833edaf32c8153559089195376128ae9f533a5e89fc4c256a50f6df";

describe("getTransactions — sync must not mutate frozen initialAccount credentials", () => {
  it("does not mutate frozen credentials sourced from initialAccount", async () => {
    const usedKey = "bd2717d482fa89b20f7ba1299344d203d14cfa231d8da9847aa51e07"; // gitleaks:allow
    const initialAccount = deepFreeze({
      cardanoResources: {
        externalCredentials: [
          {
            isUsed: false,
            key: usedKey,
            path: { account: 0, chain: 0, coin: 1815, index: 0, purpose: 1852 },
          },
        ],
        internalCredentials: [],
      },
    } as unknown as CardanoAccount);

    jest.mocked(getAllTransactionsByKeys).mockResolvedValue({
      transactions: [
        {
          fees: "0",
          hash: "tx1",
          timestamp: "2024-01-01T00:00:00.000Z",
          blockHeight: 1,
          inputs: [],
          outputs: [{ address: "addr", value: "5", paymentKey: usedKey, tokens: [] }],
          certificate: {
            stakeRegistrations: [],
            stakeDeRegistrations: [],
            stakeDelegations: [],
          },
        },
      ],
      blockHeight: 1,
    } as any);

    const result = await getTransactions(xpub, 0, initialAccount, 0, { id: "cardano" } as any);

    expect(result.externalCredentials.find(c => c.key === usedKey)?.isUsed).toBe(true);
    expect(initialAccount.cardanoResources.externalCredentials[0].isUsed).toBe(false);
  });
});
