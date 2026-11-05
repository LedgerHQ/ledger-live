import { render, screen, within } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import { CoinConfig } from "./CoinConfig";
import { COUNTERVALUES_KEY, ETH_KEY, SOLANA_KEY, createTestHost } from "./testHost";

describe("CoinConfig (web)", () => {
  it("should list the coin config keys, then every key on the All filter", async () => {
    const { user } = renderCoinConfig();

    expect(screen.getByRole("button", { name: new RegExp(SOLANA_KEY) })).toBeVisible();
    expect(screen.queryByText(COUNTERVALUES_KEY)).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /^All/ }));

    expect(screen.getByText(COUNTERVALUES_KEY)).toBeVisible();
  });

  it("should search the keys of the active filter", async () => {
    const { user } = renderCoinConfig();

    await user.type(screen.getByPlaceholderText("Search config keys..."), "solana");

    expect(screen.getByText(SOLANA_KEY)).toBeVisible();
    expect(screen.queryByText(ETH_KEY)).not.toBeInTheDocument();
  });

  it("should override a key from its dialog", async () => {
    const { user, spies } = renderCoinConfig();

    await user.click(screen.getByRole("button", { name: new RegExp(SOLANA_KEY) }));
    const dialog = screen.getByRole("dialog");
    const editor = within(dialog).getByLabelText("JSON value");
    await user.clear(editor);
    await user.type(editor, '{{"token2022Enabled":true}');
    await user.click(within(dialog).getByRole("button", { name: "Apply" }));

    expect(spies.setOverride).toHaveBeenCalledWith(SOLANA_KEY, { token2022Enabled: true });
    expect(within(dialog).getByText("Overridden locally")).toBeVisible();
    expect(screen.getByText("1 overridden")).toBeVisible();
  });

  it("should keep Apply disabled while the JSON is invalid", async () => {
    const { user } = renderCoinConfig();

    await user.click(screen.getByRole("button", { name: new RegExp(SOLANA_KEY) }));
    const dialog = screen.getByRole("dialog");
    const editor = within(dialog).getByLabelText("JSON value");
    await user.clear(editor);
    await user.type(editor, "not json");

    expect(editor).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("should restore a key from its dialog", async () => {
    const { user, spies } = renderCoinConfig({ [SOLANA_KEY]: { token2022Enabled: true } });

    await user.click(screen.getByRole("button", { name: new RegExp(SOLANA_KEY) }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Restore" }));

    expect(spies.clearOverride).toHaveBeenCalledWith(SOLANA_KEY);
    expect(screen.queryByText("1 overridden")).not.toBeInTheDocument();
  });

  it("should reset every override from the actions menu", async () => {
    const { user, spies } = renderCoinConfig({
      [SOLANA_KEY]: { token2022Enabled: true },
      [ETH_KEY]: { status: "beta" },
    });
    expect(screen.getByText("2 overridden")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Reset all overrides" }));

    expect(spies.clearAllOverrides).toHaveBeenCalled();
    expect(screen.queryByText("2 overridden")).not.toBeInTheDocument();
  });
});

function renderCoinConfig(initialOverrides?: Record<string, unknown>) {
  const { Host, spies } = createTestHost(CoinConfig);
  const user = userEvent.setup();
  render(<Host initialOverrides={initialOverrides} />);
  return { user, spies };
}
