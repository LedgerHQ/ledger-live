import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountTransaction from "./AccountTransaction";
import type { AccountTransactionToolAccount, AccountTransactionToolPrepared } from "../types";

const mockAccount: AccountTransactionToolAccount = {
  accountUUID: "uuid-mock",
  label: "ethereum · mock",
  assetIds: ["ethereum", "ethereum/erc20/usd__coin"],
  canSign: true,
};

const realAccount: AccountTransactionToolAccount = {
  ...mockAccount,
  accountUUID: "uuid-real",
  label: "ethereum · account",
  canSign: false,
};

const prepared = (over: Partial<AccountTransactionToolPrepared> = {}) => ({
  preparationId: "prep-1",
  sourceId: "mock",
  amount: "1000",
  fees: "21",
  feeAssetId: "ethereum",
  totalSpent: "1021",
  errors: [],
  warnings: [],
  ...over,
});

function renderTool(accounts = [mockAccount, realAccount]) {
  const props = {
    accounts,
    onPrepare: jest.fn().mockResolvedValue(prepared()),
    onEstimateFees: jest
      .fn()
      .mockResolvedValue([{ strategy: "slow", fees: "10", feeAssetId: "ethereum" }]),
    onSignAndBroadcast: jest.fn().mockResolvedValue({ hash: "0xhash", pendingRows: 1 }),
    onRelease: jest.fn(),
  };
  const { unmount } = render(<AccountTransaction {...props} />);
  return { ...props, unmount };
}

function deferred<T>() {
  const handle: { resolve?: (value: T) => void } = {};
  const promise = new Promise<T>(resolve => {
    handle.resolve = resolve;
  });
  return { promise, resolve: (value: T) => handle.resolve?.(value) };
}

async function prepareFrom(accountUUID: string) {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText("Account"), accountUUID);
  await user.type(screen.getByLabelText("Recipient"), "0xabc");
  await user.type(screen.getByLabelText("Amount"), "1000");
  await user.click(screen.getByRole("button", { name: "Prepare" }));
  await screen.findByRole("table", { name: "Prepared transaction" });
  return user;
}

describe("AccountTransaction", () => {
  it("should prepare, sign and broadcast a send from a mock account", async () => {
    const props = renderTool();
    const user = await prepareFrom("uuid-mock");

    expect(props.onPrepare).toHaveBeenCalledWith(
      "uuid-mock",
      expect.objectContaining({ assetId: "ethereum", recipient: "0xabc", amount: "1000" }),
    );
    expect(screen.getByText(/the signature is simulated/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Sign and broadcast" }));
    expect(props.onSignAndBroadcast).toHaveBeenCalledWith("prep-1");
    expect(await screen.findByText(/Broadcast 0xhash · 1 pending row/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign and broadcast" })).toBeDisabled();
  });

  it("should stop a real account at the preparation, the sign intent not wired yet", async () => {
    renderTool();
    await prepareFrom("uuid-real");
    expect(screen.getByText(/needs the sign Device Intent, not wired/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign and broadcast" })).toBeDisabled();
  });

  it("should show a failed signature as an alert and let the user sign again", async () => {
    const props = renderTool();
    props.onSignAndBroadcast.mockRejectedValueOnce(new Error("Prepare again"));
    const user = await prepareFrom("uuid-mock");

    await user.click(screen.getByRole("button", { name: "Sign and broadcast" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Prepare again");

    await user.click(screen.getByRole("button", { name: "Sign and broadcast" }));
    expect(await screen.findByText(/Broadcast 0xhash/)).toBeVisible();
    expect(props.onSignAndBroadcast).toHaveBeenCalledTimes(2);
  });

  it("should not sign a preparation with errors, and show why", async () => {
    const user = userEvent.setup();
    const props = renderTool();
    props.onPrepare.mockResolvedValue(prepared({ errors: ["NotEnoughBalance (amount)"] }));
    await user.selectOptions(screen.getByLabelText("Account"), "uuid-mock");
    await user.click(screen.getByRole("button", { name: "Prepare" }));
    expect(await screen.findByText("NotEnoughBalance (amount)")).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign and broadcast" })).toBeDisabled();
  });

  it("should show the fee estimates, and a failure as an alert", async () => {
    const user = userEvent.setup();
    const props = renderTool();
    await user.selectOptions(screen.getByLabelText("Account"), "uuid-real");
    await user.click(screen.getByRole("button", { name: "Estimate fees" }));
    expect(await screen.findByRole("table", { name: "Fee estimates" })).toBeVisible();
    expect(props.onEstimateFees).toHaveBeenCalledWith("uuid-real", expect.anything(), [
      "slow",
      "medium",
      "fast",
    ]);

    props.onPrepare.mockRejectedValue(new Error("recipient: Too small"));
    await user.click(screen.getByRole("button", { name: "Prepare" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("recipient: Too small");

    await user.type(screen.getByLabelText("Recipient"), "0xabc");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("should release the preparation it replaces or leaves", async () => {
    const props = renderTool();
    const user = await prepareFrom("uuid-mock");
    await user.click(screen.getByRole("button", { name: "Prepare" }));
    expect(props.onRelease).toHaveBeenCalledWith("prep-1");

    await user.selectOptions(screen.getByLabelText("Account"), "uuid-real");
    expect(props.onRelease).toHaveBeenCalledTimes(2);
  });

  it("should drop the preparation and the fee estimates once the form changes", async () => {
    const props = renderTool();
    const user = await prepareFrom("uuid-mock");
    await user.click(screen.getByRole("button", { name: "Estimate fees" }));
    await screen.findByRole("table", { name: "Fee estimates" });

    await user.type(screen.getByLabelText("Amount"), "0");

    expect(props.onRelease).toHaveBeenCalledWith("prep-1");
    expect(screen.queryByRole("table", { name: "Prepared transaction" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Fee estimates" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign and broadcast" })).toBeNull();
  });

  it("should lock the account and the form while a call runs", async () => {
    const props = renderTool();
    const pending = deferred<AccountTransactionToolPrepared>();
    props.onPrepare.mockReturnValue(pending.promise);
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Account"), "uuid-mock");
    await user.click(screen.getByRole("button", { name: "Prepare" }));

    expect(screen.getByLabelText("Account")).toBeDisabled();
    expect(screen.getByLabelText("Recipient")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prepare" })).toBeDisabled();

    await act(async () => pending.resolve(prepared()));
    expect(screen.getByLabelText("Account")).toBeEnabled();
    expect(screen.getByLabelText("Recipient")).toBeEnabled();
  });

  it("should release the current preparation on unmount", async () => {
    const props = renderTool();
    await prepareFrom("uuid-mock");
    props.unmount();
    expect(props.onRelease).toHaveBeenCalledWith("prep-1");
  });

  it("should not release a broadcast preparation on unmount", async () => {
    const props = renderTool();
    const user = await prepareFrom("uuid-mock");
    await user.click(screen.getByRole("button", { name: "Sign and broadcast" }));
    await screen.findByText(/Broadcast 0xhash/);
    props.unmount();
    expect(props.onRelease).not.toHaveBeenCalled();
  });
});
