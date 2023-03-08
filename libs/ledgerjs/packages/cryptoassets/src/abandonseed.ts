import invariant from "invariant";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * these are either "dead"/"burn" addresses OR "abandon" seed addresses.
 * These addresses are PUBLIC addresses
 * We use them for tests and also for dry-run estimations
 * DO NOT USE AS RECIPIENT OR SIGN TRANSACTIONS INTO THEM
 */
const abandonSeedAddresses: Partial<Record<CryptoCurrency["id"], string>> = {
  algorand: "PSHLIWQKDEETIIBQEOTLGCT5IF7BTTOKCUULONOGVGF2HYDT2IHW3H4CCI",
  // https://snowtrace.io/address/0x000000000000000000000000000000000000dead/tokens
  avalanche_c_chain: "0x000000000000000000000000000000000000dEaD",
  cosmos: "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4",
  ripple: "rHsMGQEkVNJmpGWs8XUBoTBiAAbwxZN5v3",
  stellar: "GDYPMQMYW2JTLPWAUAHIDY3E4VHP5SGTFC5SMA45L7ZPOTHWQ2PHEW3E",
  tezos: "tz1VJitLYB31fEC82efFkLRU4AQUH9QgH3q6",
  tron: "0x0000000000000000000000000000000000000000",
  ethereum: "0x0000000000000000000000000000000000000000",
  bitcoin: "1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA",
  bitcoin_cash: "1mW6fDEMjKrDHvLvoEsaeLxSCzZBf3Bfg",
  bitcoin_gold: "GeTZ7bjfXtGsyEcerSSFJNUSZwLfjtCJX9",
  bitcoin_private: "b1SGV7U5kGAMHtGbkAR3mjaZqVn57SHFbiR",
  bitcoin_testnet: "mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV",
  dash: "XoJA8qE3N2Y3jMLEtZ3vcN42qseZ8LvFf5",
  decred: "DshusByvZ2y4HuUaqkb7LrNTQTrqCjLnBW7",
  digibyte: "DG1KhhBKpsyWXTakHNezaDQ34focsXjN1i",
  dogecoin: "DBus3bamQjgJULBJtYXpEzDWQRwF5iwxgC",
  game_credits: "GJgbzWpGhrZmSvc2V5Npqf57Kg9xfB79tj",
  komodo: "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi",
  litecoin: "LUWPbpM43E2p7ZSh8cyTBEkvpHmr3cB8Ez",
  nix: "GRpn2DPiQxAczMrQFt2sK1CS8EYdnvSHxo",
  peercoin: "PFinP8Tm5hFJKfVnSMFfiNibPNfHgXzTDZ",
  pivx: "DDBxSas734KhMp1Btga3LdwWAc1igSER8o",
  polkadot: "111111111111111111111111111111111HC1",
  qtum: "QPvRe2C17qk24K6v5gTg7CPghZ8b4WMxZP",
  stealthcoin: "SKsLkKVeMtPNZQuNfUNXi3Bk1TwP1QPqJG",
  stratis: "Sdo6x9k5AxWtfyJe5B9SZPteYTKgUoMMr1",
  vertcoin: "Vce16eJifb7HpuoTFEBJyKNLsBJPo7fM83",
  viacoin: "VfwB3jbDWELpfiFNzbEVgx73HsR9bAq35C",
  zcash: "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F",
  zclassic: "t1Qmwyih5F7Mw6Vts4tSnXuA2o3NgJPYNgP",
  zcoin: "a1bW3sVVUsLqgKuTMXtSaAHGvpxKwugxPH",
  zencash: "zngWJRgpBa45KUeRuCmdMsqti4ohhe9sVwC",
  bsc: "0x0000000000000000000000000000000000000000",
  solana: "GjJyeC1r2RgkuoCWMyPYkCWSGSGLcz266EaAkLA27AhL",
  polygon: "0x0000000000000000000000000000000000000000",
  crypto_org: "cro1r3ywhs4ng96dnm9zkc5y3etl7tps5cvvz26lr4",
  crypto_org_croeseid: "cro1r3ywhs4ng96dnm9zkc5y3etl7tps5cvvz26lr4",
  celo: "0xE70E8AfeF87CC8F0D7a61F58535F6EC99cd860cA",
  elrond: "erd1sqhjrtmsn5yjk6w85099p8v0ly0g8z9pxeqe5dvu5rlf2n7vq3vqytny9g",
  ethereum_classic: "0x0000000000000000000000000000000000000000",
  ethereum_ropsten: "0x0000000000000000000000000000000000000000",
  ethereum_goerli: "0x0000000000000000000000000000000000000000",
  hedera: "0.0.163372",
  cardano_testnet:
    "addr1qykrup76qz622wxgmqtuumr6mn3vvkqc4jgxj6ytqudchccayfawlf9hwv2fzuygt2km5v92kvf8e3s3mk7ynxw77cwq80z2rm",
  cardano:
    "addr1qykrup76qz622wxgmqtuumr6mn3vvkqc4jgxj6ytqudchccayfawlf9hwv2fzuygt2km5v92kvf8e3s3mk7ynxw77cwq80z2rm",
  filecoin: "f1qode47ievxlxzk6z2viuovedabmn3tq6t57uqhq",
  osmo: "cosmos19rl4cm2hmr8afy4kldpxz3fka4jguq0auqdal4",
  fantom: "0x0000000000000000000000000000000000000000",
  cronos: "0x0000000000000000000000000000000000000000",
  moonbeam: "0x0000000000000000000000000000000000000000",
  songbird: "0x0000000000000000000000000000000000000000",
  flare: "0x0000000000000000000000000000000000000000",
  near: "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d",
};

/**
 * Returns a valid address for a given currency.
 * These addresses are PUBLIC addresses
 * We use them for tests and also for dry-run estimations
 * DO NOT USE AS RECIPIENT OR SIGN TRANSACTIONS INTO THEM
 * @param {*} currencyId
 */
// TODO: signature should be getAbandonSeedAddress(currencyId: CryptoCurrencyId)
export const getAbandonSeedAddress = (currencyId: string): string => {
  invariant(
    abandonSeedAddresses[currencyId] !== undefined,
    `No abandonseed available for ${currencyId}`
  );

  return abandonSeedAddresses[currencyId]!;
};
