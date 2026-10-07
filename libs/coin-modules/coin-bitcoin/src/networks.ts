import { BigNumber } from "bignumber.js";

/**
 * Network parameters of the currencies coin-bitcoin serves (address versions, fee and dust policy,
 * sighash type, …), shared by the legacy bridge and the coin module API. Free of Ledger Live types,
 * so that the API's logic can read them.
 */

export const BitcoinLikeFeePolicy = Object.freeze({
  PER_BYTE: "PER_BYTE",
  PER_KBYTE: "PER_KBYTE",
});

export const BitcoinLikeSigHashType = Object.freeze({
  SIGHASH_ALL: 0x01,
  SIGHASH_NONE: 0x02,
  SIGHASH_SINGLE: 0x03,
  SIGHASH_FORKID: 0x40,
  SIGHASH_ANYONECANPAY: 0x80,
});

export type BitcoinLikeNetworkParameters = {
  // Name of the network.
  identifier: string;
  // Version of the Pay To Public Hash standard.
  P2PKHVersion: Buffer;
  // Version of the Pay To Script Hash standard.
  P2SHVersion: Buffer;
  // Version of the Extended Public Key standard.
  xpubVersion: Buffer;
  // Policy to use when expressing fee amount, values in BitcoinLikeFeePolicy
  feePolicy: string;
  // Minimal amount a UTXO should have before being considered BTC dust.
  dustAmount: BigNumber;
  // Constant prefix to prepend all signature messages.
  messagePrefix: string;
  // Are transactions encoded with timestamp?
  usesTimestampedTransaction: boolean;
  // Delay applied to all timestamps. Used to debounce transactions.
  timestampDelay: BigNumber;
  // Bitcoin signature flag indicating what part of a transaction a signature signs, values in BitcoinLikeSigHashType
  sigHash: number;
  // Addition BIPs enabled for this network.
  additionalBIPs: string[];
};

export const getNetworkParameters = (networkName: string): BitcoinLikeNetworkParameters => {
  if (networkName === "bitcoin") {
    return {
      identifier: "btc",
      P2PKHVersion: Buffer.from([0x00]),
      P2SHVersion: Buffer.from([0x05]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(546),
      messagePrefix: "Bitcoin signed message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "bitcoin_testnet" || networkName === "bitcoin_regtest") {
    return {
      identifier: "btc_testnet",
      P2PKHVersion: Buffer.from([0x6f]),
      P2SHVersion: Buffer.from([0xc4]),
      xpubVersion: Buffer.from([0x04, 0x35, 0x87, 0xcf]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(546),
      messagePrefix: "Bitcoin signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "bitcoin_cash") {
    return {
      identifier: "abc",
      P2PKHVersion: Buffer.from([0x00]),
      P2SHVersion: Buffer.from([0x05]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(5430),
      messagePrefix: "Bitcoin signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL | BitcoinLikeSigHashType.SIGHASH_FORKID,
      additionalBIPs: [],
    };
  } else if (networkName === "bitcoin_gold") {
    return {
      identifier: "btg",
      P2PKHVersion: Buffer.from([0x26]),
      P2SHVersion: Buffer.from([0x17]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(5430),
      messagePrefix: "Bitcoin gold signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL | BitcoinLikeSigHashType.SIGHASH_FORKID,
      additionalBIPs: [],
    };
  } else if (networkName === "zcash") {
    return {
      identifier: "zec",
      P2PKHVersion: Buffer.from([0x1c, 0xb8]),
      P2SHVersion: Buffer.from([0x1c, 0xbd]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Zcash Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: ["ZIP"],
    };
  } else if (networkName === "zencash") {
    return {
      identifier: "zen",
      P2PKHVersion: Buffer.from([0x20, 0x89]),
      P2SHVersion: Buffer.from([0x20, 0x96]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Zencash Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: ["BIP115"],
    };
  } else if (networkName === "litecoin") {
    return {
      identifier: "ltc",
      P2PKHVersion: Buffer.from([0x30]),
      P2SHVersion: Buffer.from([0x32]),
      xpubVersion: Buffer.from([0x01, 0x9d, 0xa4, 0x62]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Litecoin Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "digibyte") {
    return {
      identifier: "dgb",
      P2PKHVersion: Buffer.from([0x1e]),
      P2SHVersion: Buffer.from([0x3f]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "DigiByte Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "qtum") {
    return {
      identifier: "qtum",
      P2PKHVersion: Buffer.from([0x3a]),
      P2SHVersion: Buffer.from([0x32]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Qtum Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "dash") {
    return {
      identifier: "dash",
      P2PKHVersion: Buffer.from([0x4c]),
      P2SHVersion: Buffer.from([0x01]),
      xpubVersion: Buffer.from([0x02, 0xfe, 0x52, 0xf8]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "DarkCoin Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "dogecoin") {
    return {
      identifier: "doge",
      P2PKHVersion: Buffer.from([0x1e]),
      P2SHVersion: Buffer.from([0x16]),
      xpubVersion: Buffer.from([0x02, 0xfa, 0xca, 0xfd]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "DogeCoin Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "komodo") {
    return {
      identifier: "kmd",
      P2PKHVersion: Buffer.from([0x3c]),
      P2SHVersion: Buffer.from([0x55]),
      xpubVersion: Buffer.from([0xf9, 0xee, 0xe4, 0x8d]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Komodo Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "decred") {
    return {
      identifier: "dcr",
      P2PKHVersion: Buffer.from([0x07, 0x3f]),
      P2SHVersion: Buffer.from([0x07, 0x1a]),
      xpubVersion: Buffer.from([0x02, 0xfd, 0xa9, 0x26]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Decred Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  }

  throw new Error("No network parameters set for " + networkName);
};
