import React from "react";
import { render, screen } from "tests/testSetup";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  beginMigrationRequest,
  cancelMigrationRequest,
  getMigrationRequestId,
  settleMigrationRequest,
} from "@ledgerhq/live-common/wallet-api/Perps/migrationRequest";
import { PerpsMigrationDiscovery } from "..";

jest.mock("LLD/features/AddAccountDrawer/ModularDrawerAddAccountFlowManager", () => ({
  __esModule: true,
  default: () => <div data-testid="add-account-flow" />,
}));

const currency = getCryptoCurrencyById("hypercore");
const added = [{ id: "hc-1" }] as never[];

describe("PerpsMigrationDiscovery", () => {
  afterEach(() => cancelMigrationRequest());

  it("renders the add account flow", () => {
    const request = beginMigrationRequest();
    request.catch(() => {});

    render(<PerpsMigrationDiscovery requestId={getMigrationRequestId()} currency={currency} />);

    expect(screen.getByTestId("add-account-flow")).toBeVisible();
  });

  it("cancels the request when the flow is closed before anything was added", async () => {
    const request = beginMigrationRequest();
    const { unmount } = render(
      <PerpsMigrationDiscovery requestId={getMigrationRequestId()} currency={currency} />,
    );

    unmount();

    await expect(request).rejects.toBeInstanceOf(UserRefusedOnDevice);
  });

  it("keeps the success when the flow is closed after the accounts were added", async () => {
    const request = beginMigrationRequest();
    const requestId = getMigrationRequestId();
    const { unmount } = render(
      <PerpsMigrationDiscovery requestId={requestId} currency={currency} />,
    );

    settleMigrationRequest(requestId, added);
    unmount();

    await expect(request).resolves.toEqual(added);
  });

  it("does not cancel a newer request when a stale flow goes away", async () => {
    const stale = beginMigrationRequest();
    stale.catch(() => {});
    const { unmount } = render(
      <PerpsMigrationDiscovery requestId={getMigrationRequestId()} currency={currency} />,
    );
    const current = beginMigrationRequest();

    unmount();
    settleMigrationRequest(getMigrationRequestId(), added);

    await expect(current).resolves.toEqual(added);
  });
});
