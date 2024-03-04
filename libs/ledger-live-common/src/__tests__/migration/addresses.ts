import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";

export type MigrationAddress =
  | { currencyId: CryptoCurrencyId; address: string; xpub?: never }
  | { currencyId: CryptoCurrencyId; xpub: string; address?: never };

export const migrationAddresses: MigrationAddress[] = [
  // bitcoin
  {
    currencyId: "bitcoin",
    xpub: "xpub6BuPWhjLqutPV8SF4RMrrn8c3t7uBZbz4CBbThpbg9GYjqRMncra9mjgSfWSK7uMDz37hhzJ8wvkbDDQQJt6VgwLoszvmPiSBtLA1bPLLSn",
  },
  {
    currencyId: "bitcoin",
    xpub: "xpub6DEHKg8fgKcb9at2u9Xhjtx4tXGyWqUPQAx2zNCzr41gQRyCqpCn7onSoJU4VS96GXyCtAhhFxErnG2pGVvVexaqF7DEfqGGnGk7Havn7C2",
  },
  {
    currencyId: "digibyte",
    address:
      "xpub6CV98T6ompjUmKuMaULsw4UP8yfnVCg6831rWdcPjScn6RaGWrt3b7uvTpt9hcq6tLtS1dGNzeJ9x4NpVGzLq7CFscxCdoPZ6zxkqGymx98",
  },
  {
    currencyId: "litecoin",
    address:
      "Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF",
  },
  // evm
  {
    currencyId: "ethereum",
    address: "0x61e52B436e6423e850D29569Eda0C2Fb21567ba9",
  },
  {
    currencyId: "polygon",
    address: "0x0E3F0bb9516F01f2C34c25E0957518b8aC9414c5",
  },
  // algorand
  {
    currencyId: "algorand",
    address: "ZC3HFULMJF53BF5ER4E2TTGPBRGH2Y4RVS32JZ6NH4RW7LN67HCE6UBS3Q",
  },
  {
    currencyId: "algorand",
    address: "MECOWMKPKH2NWVZTS5V5RQDGFFYBT25KNLOPHG2KUMMNKU6FOHGJT24WBI",
  },
  // cardano
  {
    currencyId: "cardano",
    xpub: "806499588e0c4a58f4119f7e6e096bf42c3f774a528d2acec9e82ceebf87d1ceb3d4f3622dd2c77c65cc89c123f79337db22cf8a69f122e36dab1bf5083bf82d",
  },
  // casper
  {
    currencyId: "casper",
    address: "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581",
  },
  // cosmos
  {
    currencyId: "axelar",
    address: "axelar1gyauvl44q2apn3u3aujm36q8zrj74vry3kglyg",
  },
  {
    currencyId: "coreum",
    address: "core1sel9ys8a7jlsmrxp9692zfjncnmhxkws0qr3g9",
  },
  {
    currencyId: "cosmos",
    address: "cosmos1g84934jpu3v5de5yqukkkhxmcvsw3u2ajxvpdl",
  },
  {
    currencyId: "desmos",
    address: "desmos1gyauvl44q2apn3u3aujm36q8zrj74vrypqn8c3",
  },
  // {
  //   currencyId: "dydx",
  //   address: "dydx1gyauvl44q2apn3u3aujm36q8zrj74vryupsn07",
  // },
  {
    currencyId: "injective",
    address: "inj1hn46zvx43mxq47vsecvw84k5chjhuhwp6d62dt",
  },
  {
    currencyId: "onomy",
    address: "onomy1gyauvl44q2apn3u3aujm36q8zrj74vry0e2p7v",
  },
  {
    currencyId: "osmosis",
    address: "osmo10h50supk4en682vrjkc6wkgkpcyxyqn4vxjy2c",
  },
  {
    currencyId: "persistence",
    address: "persistence1gyauvl44q2apn3u3aujm36q8zrj74vrym5cypd",
  },
  {
    currencyId: "quicksilver",
    address: "quick1gyauvl44q2apn3u3aujm36q8zrj74vry7uw9km",
  },
  // {
  //   currencyId: "secret_network",
  //   address: "secret1gyauvl44q2apn3u3aujm36q8zrj74vryha27j4",
  // },
  {
    currencyId: "sei_network",
    address: "sei1gyauvl44q2apn3u3aujm36q8zrj74vryc50pfg",
  },
  {
    currencyId: "stargaze",
    address: "stars1gyauvl44q2apn3u3aujm36q8zrj74vrypyf2yc",
  },
  {
    currencyId: "umee",
    address: "umee1gyauvl44q2apn3u3aujm36q8zrj74vry8wrgtm",
  },
  {
    currencyId: "polkadot",
    address: "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV",
  },
  // polkadot
  {
    currencyId: "polkadot",
    address: "13jAJfhpFkRZj1TSSdFopaiFeKnof2q7g4GNdcxcg8Lvx6QN",
  },
  {
    currencyId: "polkadot",
    address: "15oodc5d8DWJodZhTD6qsxxSQRYWhdkWCrwqNHajDirXRrAD",
  },
  {
    currencyId: "polkadot",
    address: "12EsPA79dvhtjp1bYvCiEWPsQmmdKGss44GzE3CT9tTo9g4Q",
  },
  // solana
  {
    currencyId: "solana",
    address: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
  },
  {
    currencyId: "solana",
    address: "7b6Q3ap8qRzfyvDw1Qce3fUV8C7WgFNzJQwYNTJm3KQo",
  },
  // stellar
  {
    currencyId: "stellar",
    address: "GAT4LBXYJGJJJRSNK74NPFLO55CDDXSYVMQODSEAAH3M6EY4S7LPH5GV",
  },
  {
    currencyId: "stellar",
    address: "GCDDN6T2LJN3T7SPWJQV6BCCL5KNY5GBN7X4CMSZLDEXDHXAH32TOAHS",
  },
  // tezos
  {
    currencyId: "tezos",
    xpub: "02389ffd73423626894cb151416e51c72ec285376673daf83545eb5edb45b261ce",
  },
  {
    currencyId: "tezos",
    xpub: "02a9ae8b0ff5f9a43565793ad78e10db6f12177d904d208ada591b8a5b9999e3fd",
  },
  {
    currencyId: "tron",
    address: "THAe4BNVxp293qgyQEqXEkHMpPcqtG73bi",
  },
  // tron
  {
    currencyId: "tron",
    address: "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9",
  },
  // vechain
  {
    currencyId: "vechain",
    address: "0x0fe6688548f0C303932bB197B0A96034f1d74dba",
  },
  {
    currencyId: "vechain",
    address: "0xC0dFC490f8fba6A573C55a68dd9023f999ccaDA0",
  },
  // ripple
  {
    currencyId: "ripple",
    address: "rageXHB6Q4VbvvWdTzKANwjeCT4HXFCKX7",
  },
];
