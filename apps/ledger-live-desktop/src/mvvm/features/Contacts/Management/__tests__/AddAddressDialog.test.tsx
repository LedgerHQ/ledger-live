import React from "react";
import { render, screen } from "tests/testSetup";
import { AddAddressDialog } from "../components/AddAddressDialog";
import type { Contact } from "~/renderer/contacts/types";

// Replace the real device runner with a no-op so the third step
// resolves synchronously without trying to spin up `useConnectAppAction`.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: ({ onDone }: { onDone: (ok: boolean) => void }) => (
      <button
        type="button"
        data-testid="run-device-action-stub"
        onClick={() => onDone(true)}
      >
        run-device-action-stub
      </button>
    ),
  }),
);

const contact: Contact = {
  name: "Alice",
  groupHandleHex: "deadbeef",
  hmacNameHex: "cafebabe",
  entries: [],
};

const baseProps = (
  overrides: Partial<React.ComponentProps<typeof AddAddressDialog>> = {},
) => ({
  open: true,
  onOpenChange: jest.fn(),
  contact,
  ...overrides,
});

describe("AddAddressDialog", () => {
  it("opens on the asset picker with the search input + the top 50 entries", () => {
    render(<AddAddressDialog {...baseProps()} />);

    expect(
      screen.getByTestId("contacts-management-add-address-asset-step"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-add-address-asset-search"),
    ).toBeInTheDocument();
    // Spot-check that a few well-known entries render.
    expect(screen.getByTestId("contacts-management-add-address-asset-bitcoin")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-add-address-asset-ethereum")).toBeInTheDocument();
    expect(screen.getByTestId("contacts-management-add-address-asset-usd-coin")).toBeInTheDocument();
  });

  it("disables non-EVM crypto rows", () => {
    render(<AddAddressDialog {...baseProps()} />);

    const bitcoinRow = screen.getByTestId("contacts-management-add-address-asset-bitcoin");
    const ethereumRow = screen.getByTestId("contacts-management-add-address-asset-ethereum");

    expect(bitcoinRow).toHaveAttribute("data-disabled", "true");
    expect(ethereumRow).toHaveAttribute("data-disabled", "false");
  });

  it("auto-skips the network step when the asset has a single network", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // Ethereum's CryptoOption lists multiple chains (ethereum, arbitrum,
    // optimism, base, linea) — so pick one with exactly 1 network:
    // `binancecoin` → ["bsc"].
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );

    expect(
      screen.queryByTestId("contacts-management-add-address-network-step"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-add-address-address-step"),
    ).toBeInTheDocument();
  });

  it("shows the network step when the asset has multiple networks", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-usd-coin"),
    );

    expect(
      screen.getByTestId("contacts-management-add-address-network-step"),
    ).toBeInTheDocument();
    // The USDC config lists ethereum/polygon/base/arbitrum/optimism/avalanche/solana.
    expect(
      screen.getByTestId("contacts-management-add-address-network-ethereum"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("contacts-management-add-address-network-polygon"),
    ).toBeInTheDocument();
  });

  it("gates the Register button until both address + name are valid", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // binancecoin's CryptoOption lists exactly one network so the asset
    // pick lands us directly on the address step.
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );

    const submit = screen.getByTestId(
      "contacts-management-add-address-submit",
    ) as HTMLButtonElement;
    // Even though the name field pre-fills with the crypto's display
    // name (BNB), the address field is empty → submit stays disabled.
    expect(submit).toBeDisabled();

    // Clear the prefilled name so we can re-exercise the "name
    // missing" gate explicitly.
    await user.clear(screen.getByTestId("contacts-management-add-address-name"));
    await user.type(
      screen.getByTestId("contacts-management-add-address-hex"),
      "0x" + "a".repeat(40),
    );
    expect(submit).toBeDisabled(); // name now empty

    await user.type(
      screen.getByTestId("contacts-management-add-address-name"),
      "My BNB",
    );
    expect(submit).toBeEnabled();
  });

  it("renders the inline Paste tag only while the address input is empty", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // Land on the address step (binancecoin auto-advances).
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );

    // Paste tag is visible on initial empty input.
    expect(
      screen.getByTestId("contacts-management-add-address-paste"),
    ).toBeInTheDocument();

    // Type anything → tag disappears.
    await user.type(
      screen.getByTestId("contacts-management-add-address-hex"),
      "0x",
    );
    expect(
      screen.queryByTestId("contacts-management-add-address-paste"),
    ).not.toBeInTheDocument();
  });

  // We don't exercise the clipboard fill in jsdom — `navigator.clipboard`
  // is a non-configurable read-only property here, and even after
  // `Object.defineProperty(..., { configurable: true })` the click
  // doesn't reliably propagate through Lumen Tag's div + the input's
  // suffix layout under user-event / fireEvent. The "renders only
  // while the input is empty" test above pins the visible-state
  // contract; the click → clipboard wiring is verified manually in
  // the Electron build (where the real Clipboard API is available).

  it("pre-fills the address-name input with the selected crypto's display name", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // Pick BNB (single-network → auto-advances to address step).
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );

    const nameInput = screen.getByTestId(
      "contacts-management-add-address-name",
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("BNB");
  });

  it("re-seeds the prefill when the user backs out and picks a different crypto", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // First selection: BNB → "BNB".
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );
    expect(
      (
        screen.getByTestId(
          "contacts-management-add-address-name",
        ) as HTMLInputElement
      ).value,
    ).toBe("BNB");

    // Back → asset picker → pick USDC → network step → ethereum.
    await user.click(
      screen.getByRole("button", { name: "components.dialogHeader.goBackAriaLabel" }),
    );
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-usd-coin"),
    );
    await user.click(
      screen.getByTestId("contacts-management-add-address-network-ethereum"),
    );

    expect(
      (
        screen.getByTestId(
          "contacts-management-add-address-name",
        ) as HTMLInputElement
      ).value,
    ).toBe("USD Coin");
  });

  it("transitions to the device runner when Register is clicked with a valid payload", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );
    await user.type(
      screen.getByTestId("contacts-management-add-address-hex"),
      "0x" + "b".repeat(40),
    );
    await user.type(
      screen.getByTestId("contacts-management-add-address-name"),
      "Cold storage",
    );
    await user.click(screen.getByTestId("contacts-management-add-address-submit"));

    expect(screen.getByTestId("run-device-action-stub")).toBeInTheDocument();
  });

  it("back from the network step returns to the asset picker", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // Pick USDC (multi-network) → lands on the network step.
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-usd-coin"),
    );
    expect(
      screen.getByTestId("contacts-management-add-address-network-step"),
    ).toBeInTheDocument();

    // Lumen's `DialogHeader` renders the back affordance with
    // `aria-label="Back"`. Click it.
    await user.click(screen.getByRole("button", { name: "components.dialogHeader.goBackAriaLabel" }));

    // Asset picker is back on screen.
    expect(
      screen.getByTestId("contacts-management-add-address-asset-step"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("contacts-management-add-address-network-step"),
    ).not.toBeInTheDocument();
  });

  it("back from the address step returns to the network step when the crypto has multiple networks", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // USDC → network → ethereum → address step.
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-usd-coin"),
    );
    await user.click(
      screen.getByTestId("contacts-management-add-address-network-ethereum"),
    );
    expect(
      screen.getByTestId("contacts-management-add-address-address-step"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "components.dialogHeader.goBackAriaLabel" }));

    // Back lands on the network step (NOT the asset picker), with
    // the same crypto preselected.
    expect(
      screen.getByTestId("contacts-management-add-address-network-step"),
    ).toBeInTheDocument();
  });

  it("back from the address step skips the network step when the crypto has a single network", async () => {
    const { user } = render(<AddAddressDialog {...baseProps()} />);

    // BNB on BSC — single-network crypto → forward-path auto-advance
    // skipped the network step. Back should also skip it, jumping
    // straight to the asset picker.
    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );
    expect(
      screen.getByTestId("contacts-management-add-address-address-step"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "components.dialogHeader.goBackAriaLabel" }));

    expect(
      screen.getByTestId("contacts-management-add-address-asset-step"),
    ).toBeInTheDocument();
  });

  it("closes the dialog on successful device confirmation", async () => {
    const onOpenChange = jest.fn();
    const { user } = render(<AddAddressDialog {...baseProps({ onOpenChange })} />);

    await user.click(
      screen.getByTestId("contacts-management-add-address-asset-binancecoin"),
    );
    await user.type(
      screen.getByTestId("contacts-management-add-address-hex"),
      "0x" + "c".repeat(40),
    );
    await user.type(
      screen.getByTestId("contacts-management-add-address-name"),
      "Hardware",
    );
    await user.click(screen.getByTestId("contacts-management-add-address-submit"));
    await user.click(screen.getByTestId("run-device-action-stub"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
