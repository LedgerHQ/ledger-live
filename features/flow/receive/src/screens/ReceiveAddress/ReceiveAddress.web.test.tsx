import React, { type ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  testOpenExternal,
  receiveTestWrapper,
  testAccountUUID,
  testReceive,
} from "../../__tests__/receiveTestStore";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { RECEIVE_URLS } from "../../urls";
import { ReceiveAddress } from "./ReceiveAddress";

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

const VerifyAddressExecutor = ({ selection, onExit }: UseVerifyAddressExecutorViewModelParams) => (
  <div data-testid="verify-executor">
    {selection.verification.path}
    <button onClick={() => onExit("verified")}>Done</button>
  </div>
);

describe("ReceiveAddress (Web)", () => {
  it("opens as a dialog that closes from its header", async () => {
    const onClose = jest.fn();
    renderScreen(onClose);

    expect(screen.getByTestId("receive-address")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("names the asset and its network in the header", () => {
    renderScreen();

    expect(screen.getByText("Receive ETH")).toBeVisible();
    expect(screen.getByText("Ethereum network")).toBeVisible();
  });

  it("shows the QR card once the address is read", async () => {
    renderScreen();

    expect(screen.getByTestId("receive-address-skeleton")).toBeVisible();
    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.getByTestId("receive-address-qr-code")).toBeVisible();
  });

  it("offers Retry when the address cannot be read, then shows it", async () => {
    const receive = jest
      .fn()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(testReceive);
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    await userEvent.setup().click(await screen.findByTestId("receive-address-retry"));

    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.queryByTestId("receive-address-error")).toBeNull();
    expect(receive).toHaveBeenCalledTimes(2);
  });

  it("shows the address with its first and last characters apart", async () => {
    renderScreen();

    const text = await screen.findByTestId("receive-address-text");
    expect(text).toHaveTextContent(testReceive.address);
    expect(screen.getByText("0x71C765")).toBeVisible();
    expect(screen.getByText("f6d8976F")).toBeVisible();
  });

  it("lets a Zcash account pick its private address, then go back to the choice", async () => {
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

  it("should copy the address from the Copy tile", async () => {
    const onCopyAddress = jest.fn(async () => true);
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress });

    await userEvent.setup().click(await screen.findByTestId("receive-address-copy"));

    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
    expect(screen.getByTestId("receive-address-copy")).toHaveTextContent("Copied");
  });

  it("should copy the address from a click on the QR code", async () => {
    const onCopyAddress = jest.fn(async () => true);
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress });

    await userEvent.setup().click(await screen.findByTestId("receive-address-qr-code"));

    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
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

  it("should hide the address dialog while the device verifies, then show it again", async () => {
    const onClose = jest.fn();
    renderScreen(onClose, makeReceiveTestStore(), { VerifyAddressExecutor });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Got it" }));

    await user.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(screen.queryByTestId("receive-address")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByTestId("receive-address")).toBeVisible();
    expect(screen.queryByTestId("verify-executor")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should disable Verify for an address the device cannot show", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ verification: undefined }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }), { VerifyAddressExecutor });

    expect(await screen.findByRole("button", { name: "Verify" })).toBeDisabled();
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();
  });

  it("shows the family's notices and links them to their support article", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      getFamilyConfig: () => ({ notices: ["tronInactiveAccount"] }),
    });

    const notice = await screen.findByTestId("receive-address-notice-tronInactiveAccount");
    expect(notice).toHaveTextContent("Send at least 0.1 TRX");
    await userEvent.setup().click(screen.getByRole("button", { name: "Learn more" }));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("shows a service incident before the address, then the address on Continue", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      serviceIncidents: [
        {
          title: "Ethereum degraded",
          description: [
            { text: "Investigating. See " },
            { text: "this article", url: "https://support.ledger.com/article" },
          ],
        },
      ],
    });
    const user = userEvent.setup();

    const incident = screen.getByTestId("receive-address-service-status");
    expect(incident).toHaveTextContent("Ethereum degraded");
    expect(incident).toHaveTextContent("Investigating. See this article");
    expect(screen.queryByTestId("receive-address-summary")).toBeNull();

    await user.click(screen.getByRole("button", { name: "this article" }));
    expect(testOpenExternal).toHaveBeenCalledWith("https://support.ledger.com/article");

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
  });

  it("keeps the verify hint for after the incident, so the dialog still closes", async () => {
    const onClose = jest.fn();
    const receive = jest.fn(async () => mockAccountReceive());
    renderScreen(onClose, makeReceiveTestStore({ receive }), {
      VerifyAddressExecutor,
      serviceIncidents: [{ title: "Ethereum degraded" }],
    });
    await waitFor(() => expect(receive).toHaveBeenCalled());

    expect(screen.getByTestId("receive-address")).toHaveAttribute(
      "aria-label",
      "Ethereum degraded",
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows the verify hint once the user continued past the incident", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      VerifyAddressExecutor,
      serviceIncidents: [{ title: "Ethereum degraded" }],
    });

    await userEvent.setup().click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByTestId("receive-address-verify-hint")).toBeVisible();
  });

  it("opens the help from its card, each question opening its article, then back to the address", async () => {
    renderScreen();
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-help-card"));
    expect(screen.getByRole("heading", { name: "Get help" })).toBeVisible();
    expect(screen.queryByTestId("receive-address-summary")).toBeNull();

    await user.click(screen.getByText("How to receive securely?"));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.receiveSecurely);

    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("receive-address-summary")).toBeVisible();
  });

  it("shows the help card under an error too", async () => {
    const receive = jest.fn(async () => {
      throw new Error("offline");
    });
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    expect(await screen.findByTestId("receive-address-error")).toBeVisible();
    expect(screen.getByTestId("receive-address-help-card")).toHaveTextContent(
      "Need support? Get help",
    );
  });

  it("offers no memo card for an address without memo", async () => {
    renderScreen();

    await screen.findByTestId("receive-address-summary");
    expect(screen.queryByTestId("receive-address-memo-card")).toBeNull();
  });

  it("opens the memo panel from its card, then goes back to the address", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ memo: { type: "tag" } }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-memo-card"));
    expect(screen.getByTestId("receive-address-memo-panel")).toHaveTextContent(
      "You might need a Tag/Memo",
    );
    await user.click(screen.getByRole("button", { name: "Learn more" }));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.memoTag);

    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.getByTestId("receive-address-summary")).toBeVisible();
  });

  it("asks to onboard the account in place of the address, then opens the app's flow", async () => {
    const onResolveGate = jest.fn();
    renderScreen(
      jest.fn(),
      makeReceiveTestStore({
        accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
      }),
      { onResolveGate },
    );

    expect(await screen.findByTestId("receive-address-gate-onboarding")).toHaveTextContent(
      "Set up your account first",
    );
    expect(screen.queryByTestId("receive-address-skeleton")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "Onboard account" }));
    expect(onResolveGate).toHaveBeenCalledTimes(1);
  });

  it("never shows an address on the sanctions list", async () => {
    const onClose = jest.fn();
    const checkAddressSanctioned = jest.fn(async () => true);
    renderScreen(onClose, makeReceiveTestStore(), {
      checkAddressSanctioned,
      onCopyAddress: jest.fn(async () => true),
    });
    const user = userEvent.setup();

    expect(await screen.findByTestId("receive-address-sanctioned")).toHaveTextContent(
      "Keeping you safe",
    );
    expect(checkAddressSanctioned).toHaveBeenCalledWith(testReceive.address);
    expect(screen.queryByTestId("receive-address-summary")).toBeNull();
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Learn more" }));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.sanctionedAddress);
    await user.click(screen.getByTestId("receive-address-sanctioned-close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the skeletons while the sanctions check runs", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      checkAddressSanctioned: () => new Promise<boolean>(() => {}),
    });

    await waitFor(() => expect(screen.queryByTestId("receive-address-summary")).toBeNull());
    expect(screen.getByTestId("receive-address-skeleton")).toBeVisible();
  });
});
