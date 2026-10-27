import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  settleMigrationRequest,
} from "./migrationRequest";

const account = createFixtureAccount("hc");

describe("migrationRequest", () => {
  afterEach(() => cancelMigrationRequest());

  it("resolves with the accounts it is settled with", async () => {
    const { id, promise } = beginMigrationRequest();

    settleMigrationRequest(id, [account]);

    await expect(promise).resolves.toEqual([account]);
  });

  it("rejects when the user cancels the migration", async () => {
    const { promise } = beginMigrationRequest();

    cancelMigrationRequest();

    await expect(promise).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("ignores a cancel once the request has settled", async () => {
    const { id, promise } = beginMigrationRequest();

    settleMigrationRequest(id, [account]);
    cancelMigrationRequest();

    await expect(promise).resolves.toEqual([account]);
  });

  it("ignores a late settle from a request that was replaced", async () => {
    const first = beginMigrationRequest();
    cancelMigrationRequest();
    const second = beginMigrationRequest();

    settleMigrationRequest(first.id, []);
    settleMigrationRequest(second.id, [account]);

    await expect(first.promise).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second.promise).resolves.toEqual([account]);
  });

  it("only cancels the request it is given", async () => {
    const first = beginMigrationRequest();
    const second = beginMigrationRequest();

    cancelMigrationRequest(first.id);
    settleMigrationRequest(second.id, [account]);

    await expect(first.promise).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second.promise).resolves.toEqual([account]);
  });

  it("cancels a pending request when a new one starts", async () => {
    const first = beginMigrationRequest();
    const second = beginMigrationRequest();

    settleMigrationRequest(second.id, [account]);

    await expect(first.promise).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second.promise).resolves.toEqual([account]);
  });
});
