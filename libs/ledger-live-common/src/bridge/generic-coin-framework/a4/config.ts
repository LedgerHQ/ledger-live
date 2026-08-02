import { z } from "zod";
import { log } from "@ledgerhq/logs";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";

export type A4Environment = "stg" | "ppr" | "prd";

export type A4ChainEntry = {
  enabled?: boolean;
  registerOnly?: boolean;
  environment?: A4Environment;
};

export type A4Config = {
  environment: A4Environment;
  chains: Record<string, A4ChainEntry>;
};

export type A4ChainResolution = {
  read: boolean;
  register: boolean;
  environment: A4Environment;
};

const A4EnvironmentSchema = z.enum(["stg", "ppr", "prd"]).catch("prd");

const A4ChainEntrySchema = z.object({
  enabled: z.boolean().optional(),
  registerOnly: z.boolean().optional(),
  environment: A4EnvironmentSchema.optional(),
});

const A4ConfigSchema = z.object({
  environment: A4EnvironmentSchema.default("prd"),
  chains: z.record(z.string(), A4ChainEntrySchema).default({}),
});

// https://explorers.api.vault.ledger.com/a4/networks
const A4_SUPPORTED_NETWORKS: ReadonlyArray<string> = [
  "adi",
  "arbitrum",
  "arc",
  "avalanche_c_chain",
  "avalanche_c_chain_fuji",
  "base",
  "berachain",
  "bitcoin",
  "bitcoin_cash",
  "bitcoin_gold",
  "bitcoin_testnet",
  "bitcoin_testnet4",
  "bitlayer",
  "bittorrent",
  "bsc",
  "canton_network",
  "canton_network_devnet",
  "canton_network_testnet",
  "cardano",
  "cardano_testnet",
  "dash",
  "digibyte",
  "dogecoin",
  "ethereum",
  "ethereum_classic",
  "ethereum_hoodi",
  "ethereum_sepolia",
  "fantom",
  "hedera",
  "hedera_testnet",
  "hyperevm",
  "linea",
  "linea_sepolia",
  "litecoin",
  "mantle",
  "mantle_sepolia",
  "monad",
  "monad_testnet",
  "optimism",
  "polygon",
  "ripple",
  "ripple_testnet",
  "robinhood",
  "rsk",
  "shape",
  "solana",
  "solana_devnet",
  "somnia",
  "sonic",
  "stellar",
  "stellar_testnet",
  "story",
  "sui",
  "tezos",
  "tezos_testnet",
  "tron",
  "tron_testnet",
  "zero_gravity",
  "zksync",
];

const DEFAULT_A4_CONFIG: A4Config = {
  environment: "prd",
  chains: Object.fromEntries(
    A4_SUPPORTED_NETWORKS.map(id => [
      id,
      { enabled: false, registerOnly: true } satisfies A4ChainEntry,
    ]),
  ),
};

export const a4Config: ConfigSchema = {
  config_generic_a4: {
    type: "object",
    default: DEFAULT_A4_CONFIG,
  },
};

const A4_OFF: A4ChainResolution = Object.freeze({
  read: false,
  register: false,
  environment: "prd",
});

let warnedConfigMissing = false;

export function resolveA4ChainConfig(network: string): A4ChainResolution {
  try {
    const raw = LiveConfig.getValueByKey("config_generic_a4");

    const parsed = A4ConfigSchema.safeParse(raw);
    if (!parsed.success) return A4_OFF;

    const { environment: globalEnv, chains } = parsed.data;
    const entry = chains[network];

    if (!entry) return A4_OFF;

    const environment = entry.environment ?? globalEnv;

    if (entry.enabled) return { read: true, register: true, environment };
    if (entry.registerOnly) return { read: false, register: true, environment };
    return A4_OFF;
  } catch {
    if (warnedConfigMissing) return A4_OFF;
    warnedConfigMissing = true;
    log("a4", "config_generic_a4 not set in LiveConfig - A4 disabled");
    return A4_OFF;
  }
}
