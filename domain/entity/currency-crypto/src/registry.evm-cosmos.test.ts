import { CRYPTO_CURRENCIES_REGISTRY } from "./registry";

// LIVE-22457: EVM/Cosmos currencies must be fully described by this registry
// (color + explorerViews), so their metadata no longer depends on the
// deprecated static `@ledgerhq/cryptoassets` currencies file.
const EVM_COSMOS_FAMILIES = new Set(["evm", "cosmos"]);

// Legacy dead/obscure EVM chains that never had an explorer. New EVM/Cosmos
// currencies must ship one, so they are held out of the explorer assertion here
// rather than relaxing it for everyone.
const KNOWN_MISSING_EXPLORER = new Set([
  "atheios",
  "callisto",
  "ellaism",
  "ether1",
  "ethergem",
  "ethersocial",
  "gochain",
  "mix",
  "musicoin",
]);

const evmCosmosEntries = Object.values(CRYPTO_CURRENCIES_REGISTRY).filter(currency =>
  EVM_COSMOS_FAMILIES.has(currency.family),
);

describe("EVM/Cosmos currencies coverage (LIVE-22457)", () => {
  it("registry holds EVM and Cosmos currencies", () => {
    expect(evmCosmosEntries.length).toBeGreaterThan(0);
  });

  it.each(evmCosmosEntries.map(c => [c.id, c] as const))(
    "%s has a non-empty color",
    (_id, currency) => {
      expect(currency.color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    },
  );

  it.each(
    evmCosmosEntries.filter(c => !KNOWN_MISSING_EXPLORER.has(c.id)).map(c => [c.id, c] as const),
  )("%s has at least one explorer view", (_id, currency) => {
    expect(currency.explorerViews.length).toBeGreaterThan(0);
  });
});
