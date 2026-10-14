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

  it("ignores a cancel once the request has settled", async () => {
    const request = beginMigrationRequest();

    settleMigrationRequest(getMigrationRequestId(), [account]);
    cancelMigrationRequest();

    await expect(request).resolves.toEqual([account]);
  });

  it("ignores a late settle from a request that was replaced", async () => {
    const first = beginMigrationRequest();
    const firstId = getMigrationRequestId();
    cancelMigrationRequest();
    const second = beginMigrationRequest();

    settleMigrationRequest(firstId, []);
    settleMigrationRequest(getMigrationRequestId(), [account]);

    await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second).resolves.toEqual([account]);
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

  it("cancels a pending request when a new one starts", async () => {
    const first = beginMigrationRequest();
    const second = beginMigrationRequest();

    settleMigrationRequest(getMigrationRequestId(), [account]);

    await expect(first).rejects.toBeInstanceOf(UserRefusedOnDevice);
    await expect(second).resolves.toEqual([account]);
  });

  it("ignores a settle for a request that no longer exists", async () => {
    const request = beginMigrationRequest();
    cancelMigrationRequest();

    expect(() => settleMigrationRequest(null, [account])).not.toThrow();
    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });
});
