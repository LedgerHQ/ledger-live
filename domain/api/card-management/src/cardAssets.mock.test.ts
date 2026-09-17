import { PayCardInternalWalletsResponseSchema, PayCardLinkedWalletsResponseSchema } from "./schema";
import {
  addCardAssetFixture,
  CARD_ASSETS_PRESET_LOADED,
  clearCardAssetsMock,
  internalWalletsFromCardAssetsMock,
  linkedWalletsFromCardAssetsMock,
  readCardAssetsMock,
  removeCardAssetFixture,
  setCardAssetsMockEmpty,
  setCardAssetsMockLoaded,
} from "./cardAssets.mock";

describe("card assets mock", () => {
  afterEach(() => {
    clearCardAssetsMock();
  });

  it("pins nothing until a preset is applied", () => {
    expect(readCardAssetsMock()).toBeNull();
    expect(internalWalletsFromCardAssetsMock()).toBeUndefined();
    expect(linkedWalletsFromCardAssetsMock()).toBeUndefined();
  });

  it("answers an empty pair so the Assets list can show its empty copy", () => {
    setCardAssetsMockEmpty();

    expect(readCardAssetsMock()).toEqual({ preset: "empty", wallets: [] });
    expect(internalWalletsFromCardAssetsMock()).toEqual([]);
    expect(linkedWalletsFromCardAssetsMock()).toEqual([]);
  });

  it("answers a loaded pair the wire schemas accept", () => {
    setCardAssetsMockLoaded();

    const internal = internalWalletsFromCardAssetsMock();
    const linked = linkedWalletsFromCardAssetsMock();

    expect(readCardAssetsMock()?.preset).toBe("loaded");
    expect(linked).toHaveLength(CARD_ASSETS_PRESET_LOADED.length);
    expect(PayCardInternalWalletsResponseSchema.safeParse(internal).success).toBe(true);
    expect(PayCardLinkedWalletsResponseSchema.safeParse(linked).success).toBe(true);
    expect(internal?.map(({ currency }) => currency)).toEqual(["usdc", "usdt", "btc"]);
  });

  it("joins a custom row on id and can omit the internal wallet", () => {
    addCardAssetFixture({
      currency: "SOL",
      network: "Solana",
      balance: "3.14",
      unknownBalance: true,
    });

    expect(readCardAssetsMock()?.preset).toBe("custom");
    expect(internalWalletsFromCardAssetsMock()).toEqual([]);
    expect(linkedWalletsFromCardAssetsMock()).toEqual([
      expect.objectContaining({
        id: "w-sol-solana-0",
        currency: "sol",
        network: "solana",
        priority: 0,
      }),
    ]);
  });

  it("drops one custom row and clears the pin", () => {
    setCardAssetsMockLoaded();
    const [first] = readCardAssetsMock()?.wallets ?? [];
    if (first === undefined) {
      throw new Error("loaded preset must have a row");
    }

    removeCardAssetFixture(first.id);
    expect(readCardAssetsMock()?.preset).toBe("custom");
    expect(readCardAssetsMock()?.wallets).toHaveLength(CARD_ASSETS_PRESET_LOADED.length - 1);

    clearCardAssetsMock();
    expect(readCardAssetsMock()).toBeNull();
  });

  it("ignores a second wallet for the same currency and network", () => {
    addCardAssetFixture({
      currency: "usdc",
      network: "ethereum",
      balance: "1",
      unknownBalance: false,
    });
    addCardAssetFixture({
      currency: "USDC",
      network: "Ethereum",
      balance: "9",
      unknownBalance: false,
    });

    expect(readCardAssetsMock()?.wallets).toEqual([
      expect.objectContaining({ currency: "usdc", network: "ethereum", balance: "1" }),
    ]);
  });

  it("ignores a currency/network pair the catalog does not cover", () => {
    addCardAssetFixture({
      currency: "not-a-coin",
      network: "nowhere",
      balance: "1",
      unknownBalance: false,
    });

    expect(readCardAssetsMock()).toBeNull();
  });
});
