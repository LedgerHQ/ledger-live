import buildCoinConfig, {
  type CoinConfig,
  type Context,
  type CurrencyConfig,
} from "@ledgerhq/coin-module-framework/config";

export const cosmosDefaults = {
  axelar: {
    lcd: "https://axelar.coin.ledger.com",
    minGasPrice: 0.07,
    ledgerValidator: "axelarvaloper1fgklp9hemczlwtqp9jqzq3xahh38hznx7vd805",
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Axelar",
    unit: { name: "Axelar", code: "AXL", magnitude: 6 },
    denom: "uaxl",
  },
  cosmos: {
    lcd: "https://cosmoshub4.coin.ledger.com",
    minGasPrice: 0.025,
    ledgerValidator: "cosmosvaloper10wljxpl03053h9690apmyeakly3ylhejrucvtm",
    status: {
      type: "active",
      features: [
        { id: "blockchain_txs", status: "active" },
        { id: "staking_txs", status: "active" },
      ],
    },
    name: "Cosmos",
    unit: { name: "Atom", code: "ATOM", magnitude: 6 },
    denom: "uatom",
  },
  desmos: {
    lcd: "https://api.mainnet.desmos.network",
    minGasPrice: 0.0025,
    status: {
      type: "active",
    },
    name: "Desmos",
    unit: { name: "Desmos", code: "DSM", magnitude: 6 },
    denom: "udsm",
  },
  dydx: {
    lcd: "https://dydx.coin.ledger.com",
    minGasPrice: 12500000000,
    ledgerValidator: "dydxvaloper1gffkd68xcnfpzcsplf0fsuetxkysunud6a900w",
    status: {
      type: "active",
    },
    name: "dYdX",
    unit: { name: "dYdX", code: "dydx", magnitude: 18 },
    denom: "adydx",
  },
  nyx: {
    lcd: "https://api.nyx.nodes.guru",
    minGasPrice: 0,
    status: {
      type: "active",
    },
    name: "Nyx",
    unit: { name: "Nyx", code: "NYX", magnitude: 6 },
    denom: "unyx",
  },
  osmo: {
    lcd: "https://osmo.coin.ledger.com",
    minGasPrice: 0.04,
    status: {
      type: "active",
    },
    name: "Osmosis",
    unit: { name: "Osmosis", code: "OSMO", magnitude: 6 },
    denom: "uosmo",
  },
  persistence: {
    lcd: "https://rest.core.persistence.one",
    minGasPrice: 0.025,
    status: {
      type: "active",
    },
    name: "Persistence",
    unit: { name: "Persistence", code: "XPRT", magnitude: 6 },
    denom: "uxprt",
  },
  secret_network: {
    lcd: "https://lcd.mainnet.secretsaturn.net",
    minGasPrice: 0.25,
    status: {
      type: "active",
    },
    name: "SecretNetwork",
    unit: { name: "Secret", code: "SCRT", magnitude: 6 },
    denom: "uscrt",
  },
  coreum: {
    lcd: "https://rest-coreum.ecostake.com",
    minGasPrice: 0.1,
    status: {
      type: "active",
    },
    name: "TX",
    unit: { name: "TX", code: "TX", magnitude: 6 },
    denom: "ucore",
  },
  injective: {
    lcd: "https://injective.coin.ledger.com",
    minGasPrice: 900000000,
    ledgerValidator: "injvaloper1ntn4j2lsu3k60g8xj9pqshqvdj2q5tygyvczpy",
    status: {
      type: "active",
    },
    name: "Injective",
    unit: { name: "Injective", code: "INJ", magnitude: 18 },
    denom: "inj",
  },
  mantra: {
    lcd: "https://api.mantrachain.io",
    minGasPrice: 40000000000,
    ledgerValidator: "mantravaloper13cyn4zgugjz7pta8s7wkrxqp4cdrp7ygeem3fq",
    status: {
      type: "active",
    },
    name: "Mantra",
    unit: { name: "Mantra", code: "MANTRA", magnitude: 18 },
    denom: "amantra",
  },
  crypto_org: {
    lcd: "https://rest.cosmos.directory/cryptoorgchain",
    minGasPrice: 0.025,
    status: {
      type: "active",
    },
    name: "Cronos POS Chain",
    unit: { name: "CRO", code: "CRO", magnitude: 8 },
    denom: "basecro",
  },
  xion: {
    lcd: "https://verona-api.polkachu.com",
    minGasPrice: 0.04,
    ledgerValidator: "xionvaloper1t8ysd9cg6s38ak9xfadkjtvfv9uczvrn8wzv77",
    status: {
      type: "active",
    },
    name: "Verona",
    unit: { name: "Verona", code: "VERONA", magnitude: 6 },
    denom: "uxion",
  },
  babylon: {
    lcd: "https://babylon.coin.ledger.com",
    minGasPrice: 0.002, // source: https://www.mintscan.io/babylon/parameters
    status: {
      type: "active",
    },
    name: "Babylon",
    unit: { name: "Babylon", code: "BABY", magnitude: 6 },
    denom: "ubbn",
  },
  gonka: {
    // The chain's "cosmos" fee group charges bank transfers 1 ngonka per gas (v0.2.16 upgrade).
    lcd: "https://gonka.coin.ledger.com",
    minGasPrice: 1,
    status: {
      type: "active",
      // Declares the supported set: transfers only. The runtime rejects delegation messages,
      // so staking is absent here and gated in the UI by `disableDelegation` below.
      features: [{ id: "blockchain_txs", status: "active" }],
    },
    disableDelegation: true,
    name: "Gonka",
    unit: { name: "GNK", code: "GNK", magnitude: 9 },
    denom: "ngonka",
  },
} satisfies Record<string, CosmosCoinConfig>;

type CosmosConfig = {
  /** On-chain base denom (e.g. `uatom`), used to match balances, delegations and rewards. */
  denom: string;
  [key: string]: unknown;
};

export type CosmosCoinConfig = CurrencyConfig & CosmosConfig;

/**
 * The {@link Context} threaded through the coin-cosmos low layers (ADR-019). The concrete
 * Cosmos-family chain is selected via the free-form `currencyId` carried on the context.
 */
export type CosmosContext = Context<CosmosCoinConfig>;

const coinConfig: {
  setCoinConfig: (config: CoinConfig<CosmosCoinConfig>) => void;
  getCoinConfig: (currencyId?: string) => CosmosCoinConfig;
} = buildCoinConfig<CosmosCoinConfig>();
export default coinConfig;
