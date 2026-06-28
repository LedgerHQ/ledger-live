/**
 * Modular Drawer — the shared asset → network → account picker used by
 * Receive, Swap and other flows.
 */
import { by } from "detox";
import { byId, byText, byMatcher, NativeHandle } from "../helpers/elements";
import { POLL_INTERVAL, TIMEOUTS, sleep } from "../helpers/timeouts";
import { CommonPage } from "./common.page";

export class ModularDrawer extends CommonPage {
  private readonly searchInput = byId("modular-drawer-search-input");
  /** Asset row, matched by its visible display name (first match). */
  private readonly assetItem = (name: string): NativeHandle => byText(name).atIndex(0);
  /** Network row, matched by id fragment, e.g. `"ethereum"` → `/network-item-ethereum/i`. */
  private readonly networkItem = (network: string): NativeHandle =>
    byMatcher(by.id(new RegExp(`network-item-${network}`, "i"))).atIndex(0);
  /** Account row, matched by display name, e.g. `"Ethereum 1"`. */
  private readonly accountItem = (name: string): NativeHandle => byId(`account-item-name-${name}`);

  /** Type into the asset search field. */
  async search(query: string): Promise<void> {
    await this.searchInput.typeText(query);
  }

  /** Pick an asset by its display name. */
  async selectAsset(name: string): Promise<void> {
    await this.assetItem(name).tap();
  }

  /** Search for then select an asset in one step. */
  async chooseAsset(query: string, displayName: string): Promise<void> {
    await this.search(query);
    await this.selectAsset(displayName);
  }

  /** Pick a network by id fragment, e.g. `"ethereum"`. */
  async selectNetwork(network: string): Promise<void> {
    await this.networkItem(network).tap();
  }

  /**
   * Tap `network` only when the drawer is actually asking for one. Some assets
   * jump straight from Asset → Account (single swappable network), others show
   * a Network step first. Whether the step appears depends on the asset's
   * *swappable* networks (CAL/provider data), which a static `currency.networks`
   * count can't predict — e.g. ETH shows it, BTC/SOL don't. Races the network
   * row against the target account row so neither path pays a fixed wait, then
   * leaves the caller on the account step for {@link selectAccount}. Throws if
   * neither row appears within the window, rather than falling through to a
   * misleading `selectAccount` timeout (e.g. a wrong `network` id would otherwise
   * leave us stuck on the network step and blame the account row).
   */
  async selectNetworkIfAsked(network: string, accountName: string): Promise<void> {
    const networkRow = this.networkItem(network);
    const accountRow = this.accountItem(accountName);
    const maxPolls = Math.ceil(TIMEOUTS.XS / POLL_INTERVAL);
    for (let i = 0; i < maxPolls; i++) {
      if (await accountRow.isVisible()) return; // single-network asset — already on accounts
      if (await networkRow.isVisible()) {
        await networkRow.tap();
        return;
      }
      await sleep(POLL_INTERVAL);
    }
    throw new Error(
      `Modular drawer settled on neither the network step (network-item-${network}) nor the ` +
        `account step (account-item-name-${accountName}) within ${TIMEOUTS.XS}ms of choosing the asset.`,
    );
  }

  /** Pick an account by its display name, e.g. `"Ethereum 1"`. */
  async selectAccount(name: string): Promise<void> {
    await this.accountItem(name).tap();
  }
}
