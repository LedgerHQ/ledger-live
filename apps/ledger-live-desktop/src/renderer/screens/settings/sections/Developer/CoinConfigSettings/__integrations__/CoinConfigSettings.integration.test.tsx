import React from "react";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { render, screen, waitFor } from "tests/testSetup";
import {
  coinConfigOverridesSelector,
  setCoinConfigOverride,
} from "~/renderer/reducers/coinConfigOverrides";
import type { ReduxStore } from "~/state-manager/configureStore";
import { SettingsSectionBody } from "../../../../SettingsSection";
import CoinConfigSettings from "..";

const SOLANA_KEY = "config_currency_solana";
const ETH_KEY = "config_currency_ethereum";
const COUNTERVALUES_KEY = "config_countervalues_refreshRate";

/**
 * Mirrors the production sync wired in init.tsx so LiveConfig observes Redux
 * changes during a test, and returns an `unsubscribe` so callers can prevent
 * subscriptions from leaking across tests.
 */
const subscribeLiveConfigBridge = (store: ReduxStore) =>
  store.subscribe(() => {
    LiveConfig.setAllOverrides(store.getState().coinConfigOverrides.overrides);
  });

const activeUnsubscribes: Array<() => void> = [];

const renderSettings = (initialOverrides: Record<string, unknown> = {}) => {
  // Sync LiveConfig BEFORE the first render so the initial `getValueByKey`
  // reads from the test's override map instead of the default value.
  LiveConfig.setAllOverrides(initialOverrides);
  const utils = render(
    <SettingsSectionBody>
      <CoinConfigSettings />
    </SettingsSectionBody>,
    {
      initialState: {
        coinConfigOverrides: { overrides: initialOverrides },
      },
    },
  );
  const unsubscribe = subscribeLiveConfigBridge(utils.store);
  activeUnsubscribes.push(unsubscribe);
  return { ...utils, unsubscribe };
};

describe("CoinConfigSettings integration", () => {
  afterEach(() => {
    while (activeUnsubscribes.length) activeUnsubscribes.pop()!();
    LiveConfig.setAllOverrides({});
  });

  it("starts collapsed and only shows the section title", () => {
    renderSettings();

    expect(screen.getByText(/Coin configs used in Ledger Wallet/i)).toBeVisible();
    expect(screen.queryByPlaceholderText(/Search a config key/i)).not.toBeInTheDocument();
  });

  it("expanding the panel lists config_currency_* keys but hides other LiveConfig keys", async () => {
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: /Show/i }));

    expect(await screen.findByPlaceholderText(/Search a config key/i)).toBeVisible();
    expect(screen.getByText(SOLANA_KEY)).toBeVisible();
    expect(screen.getByText(ETH_KEY)).toBeVisible();
    expect(screen.queryByText(COUNTERVALUES_KEY)).not.toBeInTheDocument();
  });

  it("typing in the search input filters the visible keys", async () => {
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: /Show/i }));
    await user.type(await screen.findByPlaceholderText(/Search a config key/i), "solana");

    expect(screen.getByText(SOLANA_KEY)).toBeVisible();
    expect(screen.queryByText(ETH_KEY)).not.toBeInTheDocument();
  });

  it("a search match outside the config_currency_* prefix becomes visible", async () => {
    const { user } = renderSettings();

    await user.click(screen.getByRole("button", { name: /Show/i }));
    await user.type(await screen.findByPlaceholderText(/Search a config key/i), "countervalues");

    expect(screen.getByText(COUNTERVALUES_KEY)).toBeVisible();
  });

  it("clicking an expanded key collapses it (toggles focus off)", async () => {
    const { user } = renderSettings();
    await user.click(screen.getByRole("button", { name: /Show/i }));

    const row = await screen.findByText(SOLANA_KEY);
    await user.click(row);
    // Editor is the second textbox (search is first); presence confirms expansion.
    expect((await screen.findAllByRole("textbox")).length).toBeGreaterThan(1);

    await user.click(row);
    // After collapse the editor textbox is gone, leaving only the search input.
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  // The search input and the JSON editor share `role="textbox"`; the editor is
  // appended below the search so it's the second textbox in the document.
  const findEditor = async () => {
    const textboxes = await screen.findAllByRole("textbox");
    return textboxes[textboxes.length - 1];
  };

  it("clicking Override writes the parsed JSON into Redux and shows the local-override tag", async () => {
    const { user, store } = renderSettings();
    await user.click(screen.getByRole("button", { name: /Show/i }));
    await user.click(await screen.findByText(SOLANA_KEY));

    const editor = await findEditor();
    await user.click(editor);
    await user.clear(editor);
    await user.paste(JSON.stringify({ token2022Enabled: true }));

    await user.click(screen.getByRole("button", { name: /^Override$/i }));

    await waitFor(() => {
      expect(coinConfigOverridesSelector(store.getState())[SOLANA_KEY]).toEqual({
        token2022Enabled: true,
      });
    });
    expect(screen.getByText(/overridden locally/i)).toBeVisible();
  });

  it("an invalid JSON payload shows a warning and leaves Redux untouched", async () => {
    const { user, store } = renderSettings();
    await user.click(screen.getByRole("button", { name: /Show/i }));
    await user.click(await screen.findByText(SOLANA_KEY));

    const editor = await findEditor();
    await user.click(editor);
    await user.clear(editor);
    await user.paste("not valid json");

    await user.click(screen.getByRole("button", { name: /^Override$/i }));

    expect(await screen.findByText(/SyntaxError/i)).toBeVisible();
    expect(coinConfigOverridesSelector(store.getState())[SOLANA_KEY]).toBeUndefined();
  });

  it("clicking Restore clears a single override and removes the tag", async () => {
    const { user, store } = renderSettings({
      [SOLANA_KEY]: { token2022Enabled: true },
    });

    await user.click(screen.getByRole("button", { name: /Show/i }));
    expect(screen.getByText(/overridden locally/i)).toBeVisible();

    await user.click(await screen.findByText(SOLANA_KEY));
    await user.click(screen.getByRole("button", { name: /^Restore$/i }));

    await waitFor(() => {
      expect(coinConfigOverridesSelector(store.getState())[SOLANA_KEY]).toBeUndefined();
    });
    expect(screen.queryByText(/overridden locally/i)).not.toBeInTheDocument();
  });

  it("clicking Restore all clears every override", async () => {
    const { user, store } = renderSettings({
      [SOLANA_KEY]: { token2022Enabled: true },
      [ETH_KEY]: { showNfts: false },
    });

    await user.click(screen.getByRole("button", { name: /Show/i }));
    await user.click(screen.getByRole("button", { name: /Restore all coin configs/i }));

    await waitFor(() => {
      expect(coinConfigOverridesSelector(store.getState())).toEqual({});
    });
    expect(screen.queryByText(/overridden locally/i)).not.toBeInTheDocument();
  });

  describe("Redux ↔ LiveConfig bridge", () => {
    it("initial overrides in state are pushed into LiveConfig on mount", async () => {
      renderSettings({ [SOLANA_KEY]: { token2022Enabled: true } });

      await waitFor(() => {
        const resolved = LiveConfig.getValueByKey(SOLANA_KEY) as { token2022Enabled: boolean };
        expect(resolved.token2022Enabled).toBe(true);
      });
    });

    it("dispatching setCoinConfigOverride flows through the bridge into LiveConfig", async () => {
      const { store } = renderSettings();

      store.dispatch(setCoinConfigOverride({ key: ETH_KEY, value: { showNfts: false } }));

      await waitFor(() => {
        const resolved = LiveConfig.getValueByKey(ETH_KEY) as { showNfts: boolean };
        expect(resolved.showNfts).toBe(false);
      });
    });

    it("clearing an override via Restore reverts LiveConfig to the default value", async () => {
      const { user, store } = renderSettings({
        [SOLANA_KEY]: { token2022Enabled: true },
      });

      const overridden = LiveConfig.getValueByKey(SOLANA_KEY) as { token2022Enabled: boolean };
      expect(overridden.token2022Enabled).toBe(true);

      await user.click(screen.getByRole("button", { name: /Show/i }));
      await user.click(await screen.findByText(SOLANA_KEY));
      await user.click(screen.getByRole("button", { name: /^Restore$/i }));

      await waitFor(() => {
        expect(coinConfigOverridesSelector(store.getState())[SOLANA_KEY]).toBeUndefined();
      });
      const restored = LiveConfig.getValueByKey(SOLANA_KEY) as { token2022Enabled: boolean };
      expect(restored.token2022Enabled).toBe(false);
    });
  });
});
