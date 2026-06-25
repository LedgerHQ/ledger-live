/**
 * Modular Drawer — the shared asset → network → account picker used by
 * Receive, Swap and other flows.
 */
import { by } from "detox";
import { byId, byText, byMatcher, NativeHandle } from "../helpers/elements";
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

  /** Pick an account by its display name, e.g. `"Ethereum 1"`. */
  async selectAccount(name: string): Promise<void> {
    await this.accountItem(name).tap();
  }
}
