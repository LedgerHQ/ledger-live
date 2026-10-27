import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  getMigrationRequestId,
  settleMigrationRequest,
} from "./migrationRequest";

const account = createFixtureAccount("hc");

describe("migrationRequest", () => {
  afterEach(() => cancelMigrationRequest());

  it("resolves with the accounts it is settled with", async () => {
    const request = beginMigrationRequest();

    settleMigrationRequest(getMigrationRequestId(), [account]);

    await expect(request).resolves.toEqual([account]);
  });

  it("rejects when the user cancels the migration", async () => {
    const request = beginMigrationRequest();

    cancelMigrationRequest();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("only cancels the request it is given", async () => {
    const first = beginMigrationRequest();
    const firstId = getMigrationRequestId();
    const second = beginMigrationRequest();

    cancelMigrationRequest(firstId);
    settleMigrationRequest(getMigrationRequestId(), [account]);

    await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second).resolves.toEqual([account]);
  });
});
