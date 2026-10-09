import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { http, HttpResponse, server } from "tests/server";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BridgeSyncContext } from "@ledgerhq/live-common/bridge/react/context";
import {
  LOCAL_NODE_SERVER_URL,
  setLocalNodeCurrencies,
} from "@ledgerhq/live-common/localNode/index";
import type { Account } from "@ledgerhq/types-live";
import ClaimFundsButton from "../components/ClaimFundsButton";

const XRP_ACCOUNT = {
  type: "Account",
  id: "js:2:ripple:rADDRESS:",
  currency: getCryptoCurrencyById("ripple"),
  freshAddress: "rADDRESS",
} as unknown as Account;

const renderButton = () => {
  const sync = jest.fn();
  render(
    <BridgeSyncContext.Provider value={sync}>
      <ClaimFundsButton account={XRP_ACCOUNT} />
    </BridgeSyncContext.Provider>,
  );
  return { sync };
};

describe("ClaimFundsButton", () => {
  afterEach(() => setLocalNodeCurrencies([]));

  it("is not shown when the currency runs on its default network", () => {
    renderButton();

    expect(screen.queryByText("Claim funds")).not.toBeInTheDocument();
  });

  it("claims funds for the account and syncs it", async () => {
    setLocalNodeCurrencies(["ripple"]);
    let claimed: unknown;
    server.use(
      http.post(`${LOCAL_NODE_SERVER_URL}/xrp/airdrop`, async ({ request }) => {
        claimed = await request.json();
        return HttpResponse.json({ ok: true, txHash: "hash" });
      }),
    );
    const { sync } = renderButton();

    screen.getByText("Claim funds").click();

    await waitFor(() =>
      expect(sync).toHaveBeenCalledWith(
        expect.objectContaining({ type: "SYNC_ONE_ACCOUNT", accountId: XRP_ACCOUNT.id }),
      ),
    );
    expect(claimed).toEqual({ network: "ripple", address: "rADDRESS", amount: 100 });
  });

  it("shows why a claim failed", async () => {
    setLocalNodeCurrencies(["ripple"]);
    server.use(
      http.post(`${LOCAL_NODE_SERVER_URL}/xrp/airdrop`, () =>
        HttpResponse.json({ error: "Root account not found" }, { status: 500 }),
      ),
    );
    const { sync } = renderButton();

    screen.getByText("Claim funds").click();

    expect(await screen.findByText("Root account not found")).toBeInTheDocument();
    expect(sync).not.toHaveBeenCalled();
  });
});
