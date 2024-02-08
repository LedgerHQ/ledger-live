import { AccountBridge, Account, TransactionCommon } from "@ledgerhq/types-live";
import { firstValueFrom } from "rxjs";

type Scenario<T extends TransactionCommon> = {
  setup: () => Promise<{ accountBridge: AccountBridge<T>; account: Account }>;
  beforeAll?: () => Promise<void>;
  afterAll?: () => void;
  transactions: (T & { after?: () => void })[];
  teardown?: () => void;
};

async function executeScenario<T>(scenario: Scenario<T>) {
  const { accountBridge, account } = await scenario.setup();
  await scenario.beforeAll?.();

  let scenarioAccount = await firstValueFrom(accountBridge.sync(account, { paginationConfig: {} }));
}
