import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import type { PayCardInternalWallet, PayCardLinkedWallet } from "./types";

export function isKnownCardAssetPair(currency: string, network: string): boolean {
  return baanxAssetLedgerId(currency, network) !== undefined;
}

export type CardAssetsMockPreset = "empty" | "loaded" | "custom";

export type CardAssetFixture = Readonly<{
  id: string;
  currency: string;
  network: string;
  /** `null` = linked, but no internal wallet. */
  balance: string | null;
  address: string;
}>;

export type CardAssetFixtureDraft = Readonly<{
  currency: string;
  network: string;
  balance: string;
  unknownBalance: boolean;
}>;

export type CardAssetsMock = Readonly<{
  preset: CardAssetsMockPreset;
  wallets: readonly CardAssetFixture[];
}>;

let answers: CardAssetsMock | null = null;

export function readCardAssetsMock(): CardAssetsMock | null {
  return answers;
}

export function clearCardAssetsMock(): void {
  answers = null;
}

export const CARD_ASSETS_PRESET_LOADED: readonly CardAssetFixtureDraft[] = [
  { currency: "usdc", network: "ethereum", balance: "125.40", unknownBalance: false },
  { currency: "usdt", network: "ethereum", balance: "80.00", unknownBalance: false },
  { currency: "btc", network: "bitcoin", balance: "0.012", unknownBalance: false },
];

function fixtureFromDraft(draft: CardAssetFixtureDraft, index: number): CardAssetFixture {
  const currency = draft.currency.trim().toLowerCase();
  const network = draft.network.trim().toLowerCase();
  const id = `w-${currency}-${network}-${index}`;

  return {
    id,
    currency,
    network,
    balance: draft.unknownBalance ? null : draft.balance.trim() || "0.00",
    address: `0x${currency.padEnd(8, "0").slice(0, 8)}${index.toString(16).padStart(4, "0")}`,
  };
}

function setWallets(preset: CardAssetsMockPreset, drafts: readonly CardAssetFixtureDraft[]): void {
  answers = {
    preset,
    wallets: drafts.map(fixtureFromDraft),
  };
}

export function setCardAssetsMockEmpty(): void {
  setWallets("empty", []);
}

export function setCardAssetsMockLoaded(): void {
  setWallets("loaded", CARD_ASSETS_PRESET_LOADED);
}

export function addCardAssetFixture(draft: CardAssetFixtureDraft): void {
  const currency = draft.currency.trim().toLowerCase();
  const network = draft.network.trim().toLowerCase();
  if (!isKnownCardAssetPair(currency, network)) {
    return;
  }

  const current = answers?.wallets ?? [];
  if (current.some(wallet => wallet.currency === currency && wallet.network === network)) {
    return;
  }
  const nextDrafts: CardAssetFixtureDraft[] = [
    ...current.map(wallet => ({
      currency: wallet.currency,
      network: wallet.network,
      balance: wallet.balance ?? "",
      unknownBalance: wallet.balance === null,
    })),
    draft,
  ];

  setWallets("custom", nextDrafts);
}

export function removeCardAssetFixture(id: string): void {
  const current = answers?.wallets ?? [];
  setWallets(
    "custom",
    current
      .filter(wallet => wallet.id !== id)
      .map(wallet => ({
        currency: wallet.currency,
        network: wallet.network,
        balance: wallet.balance ?? "",
        unknownBalance: wallet.balance === null,
      })),
  );
}

export function internalWalletsFromCardAssetsMock(): readonly PayCardInternalWallet[] | undefined {
  if (answers === null) return undefined;

  return answers.wallets
    .filter((wallet): wallet is CardAssetFixture & { balance: string } => wallet.balance !== null)
    .map(({ id, balance, currency, address }) => ({
      id,
      balance,
      currency,
      address,
      addressMemo: null,
      addressId: address,
    }));
}

export function linkedWalletsFromCardAssetsMock(): readonly PayCardLinkedWallet[] | undefined {
  if (answers === null) return undefined;

  return answers.wallets.map(({ id, address, currency, network }, index) => ({
    id,
    address,
    currency,
    network,
    priority: index,
  }));
}
