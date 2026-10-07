import cashaddr from "cashaddrjs";

/**
 * Per-currency traits of the bitcoin family that shape a transaction: its format, how the Ledger
 * app signs it, and whether the coin module API serves the currency at all.
 *
 * Read by the legacy bridge (through `perCoinLogic`) and by the stateless coin module API alike, so
 * this file depends on neither: no Ledger Live account or bridge transaction type.
 */
export type CoinTraits = {
  /** Previous transactions carry data after the locktime (hw-app-btc `splitTransaction`). */
  hasExtraData?: boolean;
  /** The format carries an expiry height: not Bitcoin serialization, the device builds it. */
  hasExpiryHeight?: boolean;
  /**
   * The locktime is set to the signing time minus 777 s, which lets Komodo UTXOs created by
   * Ledger Wallet claim their interest.
   */
  hasInterestLockTime?: boolean;
  /** Device-protocol format flags (hw-app-btc `additionals`) beyond the currency id and address type. */
  additionals?: (recipient: string) => string[];
  /**
   * The currency's Ledger app is app-bitcoin-new (hw-app-btc `BtcNew`): it signs PSBTs, and the
   * transactions it builds are version 2. Every other app builds version 1 transactions.
   */
  signsPsbt?: boolean;
  /** Transactions signal replace-by-fee (BIP 125), as the bridge sends them. */
  signalsRbf?: boolean;
  /** Why the coin module API does not serve the currency, when it does not. */
  notServedByCoinModuleApi?: string;
  /**
   * The form of an address the Ledger explorer answers for, when the account may hold another one.
   * The explorer echoes that form back in transactions.
   */
  explorerAddress?: (address: string) => string;
  /**
   * The recipient's address as Ledger Wallet shows it, from the recipient's output script, for the
   * device parameters that depend on its format (`additionals`).
   */
  displayedRecipient?: (outputScript: Buffer) => string;
};

/** `bitcoincash:` form of a P2PKH cashaddr recipient; any other recipient as given. */
export const bchExplicit = (str: string): string => {
  const explicit = str.includes(":") ? str : "bitcoincash:" + str;

  try {
    const { type } = cashaddr.decode(explicit);
    if (type === "P2PKH") return explicit;
  } catch {
    // ignore errors
  }

  return str;
};

/**
 * `bitcoincash:` form of a prefixless cashaddr address (P2PKH or P2SH); any other address as given.
 * Ledger Wallet stores Bitcoin Cash addresses without the prefix, which the explorer does not
 * answer for (`balance`, `utxos`: 500; `txs`: empty).
 */
export const bchWithPrefix = (address: string): string => {
  if (address.includes(":")) return address;
  try {
    cashaddr.decode(`bitcoincash:${address}`);
    return `bitcoincash:${address}`;
  } catch {
    return address;
  }
};

const sapling = () => ["sapling"]; // FIXME (legacy) drop in ledgerjs. we always use sapling now for zcash & kmd

export const coinTraits: Partial<Record<string, CoinTraits>> = {
  bitcoin: { signsPsbt: true, signalsRbf: true },
  bitcoin_testnet: { signsPsbt: true, signalsRbf: true },
  bitcoin_regtest: { signsPsbt: true, signalsRbf: true },
  qtum: { signsPsbt: true },
  zencash: {
    hasExtraData: true, // FIXME (legacy) investigate why we need this here and drop
    notServedByCoinModuleApi:
      "Horizen transactions need replay-protected outputs and version 1; zencash stays on the legacy bridge",
  },
  zcash: {
    hasExtraData: true,
    hasExpiryHeight: true,
    additionals: sapling,
    notServedByCoinModuleApi: "zcash has its own coin module, coin-zcash",
  },
  zcash_regtest: {
    notServedByCoinModuleApi: "zcash has its own coin module, coin-zcash",
  },
  komodo: {
    hasExtraData: true,
    hasInterestLockTime: true,
    hasExpiryHeight: true,
    additionals: sapling,
  },
  decred: {
    hasExpiryHeight: true,
  },
  bitcoin_gold: {
    additionals: () => ["bip143"],
  },
  bitcoin_cash: {
    explorerAddress: bchWithPrefix,
    // Ledger Wallet shows Bitcoin Cash P2PKH recipients in cashaddr.
    displayedRecipient: script =>
      script.length === 25 && script[0] === 0x76 && script[1] === 0xa9
        ? cashaddr.encode("bitcoincash", "P2PKH", new Uint8Array(script.subarray(3, 23)))
        : "",
    additionals: recipient =>
      bchExplicit(recipient).startsWith("bitcoincash:") ? ["bip143", "cashaddr"] : ["bip143"],
  },
};
