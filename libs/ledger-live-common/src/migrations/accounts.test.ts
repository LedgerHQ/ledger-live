import { implicitMigration } from "./accounts";
import { decodeOperationId } from "../operation";
import { flattenAccounts } from "../account";
import accounts from "./accounts-dataset";
const flatAccounts = flattenAccounts(accounts);
const flatMigratedAccounts = flattenAccounts(implicitMigration(accounts));
const swapHistories = flatAccounts.map(({ swapHistory }) => swapHistory);
const migratedSwapHistories = flatMigratedAccounts.map(({ swapHistory }) => swapHistory);
describe("Swap history resillience", () => {
  test("Duplicate only the ETH swaps", () => {
    expect(swapHistories.length).toBe(migratedSwapHistories.length); // Havent lost swap histories.

    for (let i = 0; i < flatAccounts.length; i++) {
      const account = flatAccounts[i];
      const swapHistory = account.swapHistory;

      for (let j = 0; j < swapHistory.length; j++) {
        const oldSwap = swapHistory[j];
        const matches = migratedSwapHistories[i].filter(swap => swap.swapId === oldSwap.swapId);
        const shouldDuplicate =
          (account.type === "Account" && account.currency.id === "ethereum") ||
          (account.type === "TokenAccount" && account.token.parentCurrency.id === "ethereum") ||
          oldSwap.operationId.includes(":ethereum:") ||
          oldSwap.receiverAccountId.includes(":ethereum:");
        expect(matches.length).toBe(shouldDuplicate ? 2 : 1); // Duplicated if involving ETH
      }
    }
  });
  test("To actually still have the tokenId swaps", () => {
    const migratedSwaps = migratedSwapHistories.flat();
    expect(migratedSwaps.some(({ tokenId }) => !!tokenId)).toBe(true);
  });
  test("ReceiverAccountId to match a known migrated id", () => {
    const knownIds = flatMigratedAccounts.map(({ id }) => id);
    const migratedSwaps = migratedSwapHistories.flat();
    migratedSwaps.every(({ receiverAccountId }) => expect(knownIds).toContain(receiverAccountId));
  });
  test("OperationId to include a known migrated account id", () => {
    const knownIds = flatMigratedAccounts.map(({ id }) => id);
    const migratedSwaps = migratedSwapHistories.flat();
    migratedSwaps.every(({ operationId }) => {
      const { accountId } = decodeOperationId(operationId);
      expect(knownIds).toContain(accountId);
    });
  });
  test("To actually still have the tokenId swaps", () => {
    const migratedSwaps = migratedSwapHistories.flat();
    expect(migratedSwaps.some(({ tokenId }) => !!tokenId)).toBe(true);
  });
  test("applying implicitMigration a second time yield same accounts", () => {
    const first = implicitMigration(accounts);
    const second = implicitMigration(first);
    expect(second).toEqual(first);
  });
});
