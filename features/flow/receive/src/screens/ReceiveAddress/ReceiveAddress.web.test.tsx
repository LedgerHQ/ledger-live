import React, { type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { track } from "@shared/analytics";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID,
  testReceive,
} from "../../__tests__/receiveTestStore";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { RECEIVE_URLS } from "../../urls";
import { ReceiveAddress } from "./ReceiveAddress";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const renderScreen = (
  onClose = jest.fn(),
  store = makeReceiveTestStore(),
  ports: Partial<ComponentProps<typeof ReceiveAddress>> = {},
) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
      {...ports}
    />,
    { wrapper: receiveTestWrapper(store) },
  );

const VerifyAddressExecutor = ({ selection }: UseVerifyAddressExecutorViewModelParams) => (
  <div data-testid="verify-executor">{selection.verification.path}</div>
);

describe("ReceiveAddress (Web)", () => {
  it("should open as a dialog that closes from its header", async () => {
    const onClose = jest.fn();
    renderScreen(onClose, makeReceiveTestStore(), { source: "Account Page" });

    expect(screen.getByTestId("receive-address")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "close",
      page: "Receive - Confirmation",
      flow: "receive",
      source: "Account Page",
    });
  });

  it("should name the asset and its network in the header", () => {
    renderScreen();

    expect(screen.getByText("Receive ETH")).toBeVisible();
    expect(screen.getByText("Ethereum network")).toBeVisible();
  });

  it("should hold the place of the address with skeletons until it is read", async () => {
    renderScreen();

    expect(screen.getByTestId("receive-address-skeleton")).toBeVisible();
    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.queryByTestId("receive-address-skeleton")).toBeNull();
  });

  it("should show the address with its first and last characters apart", async () => {
    renderScreen();

    const text = await screen.findByTestId("receive-address-text");
    expect(text).toHaveTextContent(testReceive.address);
    expect(screen.getByText("0x71C765")).toBeVisible();
    expect(screen.getByText("f6d8976F")).toBeVisible();
  });

  it("should let a Zcash account pick its private address, then go back to the choice", async () => {
    const shielded = "u1shieldedaddressexample0000000000000000000000000000";
    const receive = jest.fn(async () => mockAccountReceive({ shielded: { address: shielded } }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-option-shielded"));

    expect(screen.getByText("Private address")).toBeVisible();
    expect(screen.getByTestId("receive-address-text")).toHaveTextContent(shielded);
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("receive-address-options")).toBeVisible();
  });

  it("should offer Retry when the address cannot be read, then show it", async () => {
    const receive = jest
      .fn()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(testReceive);
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    await userEvent.setup().click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.queryByTestId("receive-address-error")).toBeNull();
    expect(receive).toHaveBeenCalledTimes(2);
  });

  it("should never show an address on the sanctions list", async () => {
    const onClose = jest.fn();
    const onOpenUrl = jest.fn();
    const checkAddressSanctioned = jest.fn(async () => true);
    renderScreen(onClose, makeReceiveTestStore(), {
      checkAddressSanctioned,
      onOpenUrl,
      onCopyAddress: jest.fn(async () => true),
    });
    const user = userEvent.setup();

    expect(await screen.findByTestId("receive-address-sanctioned")).toHaveTextContent(
      "Keeping you safe",
    );
    expect(checkAddressSanctioned).toHaveBeenCalledWith(testReceive.address);
    expect(screen.queryByTestId("receive-address-summary")).toBeNull();
    expect(screen.queryByTestId("receive-address-copy")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Learn more" }));
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.sanctionedAddress);
    await user.click(screen.getByTestId("receive-address-sanctioned-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should keep the skeletons while the sanctions check runs", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      checkAddressSanctioned: () => new Promise<boolean>(() => {}),
    });

    await waitFor(() => expect(screen.queryByTestId("receive-address-summary")).toBeNull());
    expect(screen.getByTestId("receive-address-skeleton")).toBeVisible();
  });

  it("should hand over to the legacy flow when the account must be onboarded", async () => {
    const onUseLegacyFlow = jest.fn();
    renderScreen(
      jest.fn(),
      makeReceiveTestStore({
        accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
      }),
      { onUseLegacyFlow },
    );

    expect(await screen.findByText("Set up this account first")).toBeVisible();
    expect(screen.queryByTestId("receive-address-skeleton")).toBeNull();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continue" }));
    expect(onUseLegacyFlow).toHaveBeenCalled();
  });

  it("should copy the address from the Copy tile", async () => {
    const onCopyAddress = jest.fn(async () => true);
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress });

    await userEvent.setup().click(await screen.findByRole("button", { name: "Copy" }));

    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
    expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
  });

  it("should point at Verify until the hint is dismissed, then verify on the device", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), { VerifyAddressExecutor });
    const user = userEvent.setup();

    expect(await screen.findByTestId("receive-address-verify-hint")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Verify" }));
    expect(screen.getByTestId("verify-executor")).toHaveTextContent(testReceive.verification!.path);
  });

  it("should disable Verify for an address the device cannot show", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ verification: undefined }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }), { VerifyAddressExecutor });

    expect(await screen.findByRole("button", { name: "Verify" })).toBeDisabled();
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();
  });

  it("should show the family's notices and link them to their support article", async () => {
    const onOpenUrl = jest.fn();
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      getFamilyConfig: () => ({ notices: ["tronInactiveAccount"] }),
      onOpenUrl,
    });

    const notice = await screen.findByTestId("receive-address-notice-tronInactiveAccount");
    expect(notice).toHaveTextContent("Send at least 0.1 TRX");
    await userEvent.setup().click(screen.getByRole("button", { name: "Learn more" }));
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("should open a service incident from its banner, then go back to the address", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      serviceIncidents: [{ title: "Ethereum degraded", description: "Investigating" }],
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "See details" }));
    expect(screen.getByTestId("receive-address-service-status")).toHaveTextContent("Investigating");

    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.getByTestId("receive-address-summary")).toBeVisible();
  });

  it("should offer no memo card for an address without memo", async () => {
    renderScreen();

    await screen.findByTestId("receive-address-summary");
    expect(screen.queryByTestId("receive-address-memo-card")).toBeNull();
  });

  it("should open the memo panel from its card, then go back to the address", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ memo: { type: "tag" } }));
    const onOpenUrl = jest.fn();
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }), { onOpenUrl });
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-memo-card"));
    expect(screen.getByTestId("receive-address-memo-panel")).toHaveTextContent(
      "You might need a Tag/Memo",
    );
    await user.click(screen.getByRole("button", { name: "Learn more" }));
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.memoTag);

    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.getByTestId("receive-address-summary")).toBeVisible();
  });

  it("should open the help from its card, each question opening its article", async () => {
    const onOpenUrl = jest.fn();
    renderScreen(jest.fn(), makeReceiveTestStore(), { onOpenUrl });
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-help-card"));
    await user.click(screen.getByText("How to receive securely?"));
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.receiveSecurely);

    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("receive-address-summary")).toBeVisible();
  });
});
