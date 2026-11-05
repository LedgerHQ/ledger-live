import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountReceive from "./AccountReceive";
import type { AccountReceiveToolAccount, AccountReceiveToolAsset } from "../types";

function makeAsset(overrides: Partial<AccountReceiveToolAsset> = {}): AccountReceiveToolAsset {
  return { assetId: "ethereum", reading: false, ...overrides };
}

function makeAccount(...assets: AccountReceiveToolAsset[]): AccountReceiveToolAccount {
  return { accountUUID: "uuid-1", assets: assets.length ? assets : [makeAsset()] };
}

function renderTool(accounts: AccountReceiveToolAccount[]) {
  const onRead = jest.fn();
  const onReadAll = jest.fn();
  render(<AccountReceive accounts={accounts} onRead={onRead} onReadAll={onReadAll} />);
  return { onRead, onReadAll };
}

describe("AccountReceive", () => {
  it("says when the accounts slice is empty", () => {
    renderTool([]);
    expect(screen.getByText("0 accounts")).toBeVisible();
    expect(screen.getByText("No account in the accounts slice.")).toBeVisible();
  });

  it("shows an account never read", () => {
    renderTool([makeAccount()]);
    expect(screen.getByText("1 account")).toBeVisible();
    expect(screen.getByText("never read")).toBeVisible();
  });

  it("shows the receive address, how the device confirms it, and the answering source", () => {
    renderTool([
      makeAccount(
        makeAsset({
          status: "ready",
          sourceId: "full-sync",
          readAt: 0,
          receive: {
            address: "ldg::1220ab",
            verification: "shows canton_9f3c at m/44h/6767h/0h/0h/0h",
          },
        }),
      ),
    ]);
    expect(screen.getByText("ldg::1220ab")).toBeVisible();
    expect(screen.getByText("device shows canton_9f3c at m/44h/6767h/0h/0h/0h")).toBeVisible();
    expect(screen.getByText(/^full-sync · /)).toBeVisible();
  });

  it("says when the device cannot confirm the address", () => {
    renderTool([makeAccount(makeAsset({ status: "ready", receive: { address: "0.0.1234" } }))]);
    expect(screen.getByText("no device verification")).toBeVisible();
    expect(screen.queryByText("Verify")).toBeNull();
  });

  it("shows the shielded address next to the transparent one", () => {
    renderTool([
      makeAccount(
        makeAsset({
          status: "ready",
          receive: { address: "t1transparent" },
          shielded: { address: "u1shielded", verification: "shows u1shielded at m/32h/133h/0h" },
        }),
      ),
    ]);
    expect(screen.getByText("t1transparent")).toBeVisible();
    expect(screen.getByText("u1shielded")).toBeVisible();
  });

  it("says when the account needs its onboarding", () => {
    renderTool([makeAccount(makeAsset({ status: "onboardingRequired" }))]);
    expect(screen.getByText("onboarding required before receiving")).toBeVisible();
  });

  it("says when the token needs its activation", () => {
    renderTool([
      makeAccount(
        makeAsset(),
        makeAsset({ assetId: "hedera/hts/usdc", status: "assetActivationRequired" }),
      ),
    ]);
    expect(screen.getByText("hedera/hts/usdc")).toBeVisible();
    expect(screen.getByText("asset activation required before receiving")).toBeVisible();
  });

  it("shows the last error", () => {
    renderTool([makeAccount(makeAsset({ error: "NoAccountDataSourceError: none" }))]);
    expect(screen.getByText("NoAccountDataSourceError: none")).toBeVisible();
  });

  it("reads one asset, a token by its id, or all accounts", async () => {
    const { onRead, onReadAll } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByText("Read"));
    await userEvent.type(screen.getByLabelText("token id"), "ethereum/erc20/usd__coin");
    await userEvent.click(screen.getByText("Read token"));
    await userEvent.click(screen.getByText("Read all"));
    expect(onRead).toHaveBeenNthCalledWith(1, "uuid-1", "ethereum");
    expect(onRead).toHaveBeenNthCalledWith(2, "uuid-1", "ethereum/erc20/usd__coin");
    expect(onReadAll).toHaveBeenCalledTimes(1);
  });

  it("asks nothing for an empty token id", async () => {
    const { onRead } = renderTool([makeAccount()]);
    await userEvent.click(screen.getByText("Read token"));
    expect(onRead).not.toHaveBeenCalled();
  });

  it("disables the read of an asset being read", () => {
    renderTool([makeAccount(makeAsset({ reading: true }))]);
    expect(screen.getByText("reading…")).toBeVisible();
    expect(screen.getByText("Read")).toBeDisabled();
  });

  it("verifies an address on the device, and shows the outcome", async () => {
    const onVerify = jest.fn();
    renderTool([
      makeAccount(
        makeAsset({
          status: "ready",
          receive: {
            address: "0x1",
            verification: "shows 0x1 at m/44h/60h/0h/0/0",
            onVerify,
            verifyOutcome: "verified",
          },
        }),
      ),
    ]);
    await userEvent.click(screen.getByText("Verify"));
    expect(onVerify).toHaveBeenCalledTimes(1);
    expect(screen.getByText("verified")).toBeVisible();
  });
});
