import type { StakingMethod } from "./stakingApps";

type StakingContract = {
  /** Receipt token handed back for a deposit. Reported as `output_currency`. */
  outputCurrency?: string;
  /**
   * Token staked, for calls sent from the parent account. Reported as `input_currency`, which
   * would otherwise name the network coin.
   */
  inputCurrency?: string;
  /** Set where the contract identifies the product more precisely than the manifest can. */
  method?: StakingMethod;
  /**
   * Whether this address is the receipt token itself, rather than a pool that mints it.
   * Only these can be checked against CAL, which lists tokens and not pool contracts.
   */
  isReceiptToken?: boolean;
};

/**
 * The contracts these providers stake into, keyed by lower-cased address.
 *
 * **The deposit target is usually not the receipt token.** Of the five providers observed,
 * only Lido mints on its own token — `submit(address)` on stETH. Stader, Chorus One and Kelp
 * all deposit into a pool contract that mints the token elsewhere, and CAL returns nothing for
 * those, because a pool is not a token.
 *
 * So a token address is never evidence of a deposit target. Every entry here is either
 * observed in a real transaction or published by the provider; nothing is inferred from the
 * receipt token, because that inference was tried and was wrong three times out of five.
 *
 * An unknown contract resolves to nothing rather than to a default. Guessing `dedicated` for
 * whatever is unrecognised would turn one unmapped pool into silently wrong data; an absent
 * field is visible, and `contract_address` on the event says what to add next.
 *
 * The three `dedicated` providers — p2p, figment, and Kiln's dedicated product — stake through
 * the ETH2 deposit contract and hand back no token, so they have no entry here and take their
 * method from the manifest.
 */
const STAKING_CONTRACTS: Record<string, StakingContract> = {
  // Observed: a Lido stake calls `submit(address)` on exactly this address, which is stETH.
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": {
    outputCurrency: "stETH",
    method: "liquid",
    isReceiptToken: true,
  },
  // Published by Stader as the only contract its app should touch. A pool manager, not a
  // token — the ETHx it mints lives at a different address, below.
  "0xcf5ea1b38380f6af39068375516daf40ed70d299": { outputCurrency: "ETHx", method: "liquid" },
  /*
   * ETHx is kept although Stader does *not* deposit into it — an exit can burn the token
   * directly — but its presence must not be read as confirming a deposit targets it.
   */
  "0xa35b1b31ce002fbf2058d22f30f95d405200a15b": {
    outputCurrency: "ETHx",
    method: "liquid",
    isReceiptToken: true,
  },
  // Observed: a Kelp restake calls `depositETH` on this pool, which mints rsETH. It is not the
  // rsETH contract — the inference that it would be was wrong.
  "0x036676389e48133b63a802f8635ad39e752d375d": { outputCurrency: "rsETH", method: "restaking" },
  // Kelp's receipt token, kept for an exit that burns it directly. Not the deposit target.
  "0xa1290d69c65a6fe4df752f95823fae25cb99e5a7": {
    outputCurrency: "rsETH",
    method: "restaking",
    isReceiptToken: true,
  },
  // Observed: a Kiln pooled stake calls `stake` on psETH. This entry is also what separates
  // Kiln's pooled product from its dedicated one, which share a manifest.
  "0x5db5235b5c7e247488784986e58019fffd98fda4": {
    outputCurrency: "psETH",
    method: "pooling",
    isReceiptToken: true,
  },
  // Observed: a Coinbase pooled stake calls `stake` on lcETH.
  "0xc4dcb059dd98b45b090da8982234c61d0b9e84f9": {
    outputCurrency: "lcETH",
    method: "pooling",
    isReceiptToken: true,
  },
  // Observed on avalanche_c_chain: a StakeKit AVAX stake calls `submit` on sAVAX itself, as Lido
  // does on stETH. This is what gives StakeKit, which has no manifest method, a method here.
  "0x2b2c81e08f1af8835a78bb2a90ae924ace0ea4be": {
    outputCurrency: "sAVAX",
    method: "liquid",
    isReceiptToken: true,
  },
  // StakeKit USDe.
  "0x2d152fb171353e70e45322d32bc748f8a61d9971": { inputCurrency: "USDe" },
  // One Polygon validator's ValidatorShare: other validators have their own.
  "0x2ea3c215daeacc1c90b51443ab5d08a9ad816138": { inputCurrency: "POL" },
};

function lookup(contract: string | undefined): StakingContract | undefined {
  return contract === undefined ? undefined : STAKING_CONTRACTS[contract.toLowerCase()];
}

/** The receipt token a deposit into this contract returns. */
export function outputCurrencyOf(contract: string | undefined): string | undefined {
  return lookup(contract)?.outputCurrency;
}

/** The token staked into this contract, when the call comes from the parent account. */
export function inputCurrencyOf(contract: string | undefined): string | undefined {
  return lookup(contract)?.inputCurrency;
}

/** How this contract stakes, where the contract says it more precisely than the manifest. */
export function stakingMethodOfContract(contract: string | undefined): StakingMethod | undefined {
  return lookup(contract)?.method;
}

/**
 * Only the addresses that are receipt tokens, with the ticker they should resolve to.
 *
 * The drift guard checks these against CAL. A pool contract such as Stader's is deliberately
 * excluded: CAL lists tokens, so asking it about a pool returns nothing and would fail a guard
 * that assumed every entry were a token.
 */
export function tokenBackedContracts(): Array<[string, string]> {
  return Object.entries(STAKING_CONTRACTS).flatMap(([address, c]) =>
    c.isReceiptToken && c.outputCurrency ? [[address, c.outputCurrency] as [string, string]] : [],
  );
}
