import { BigNumber } from "bignumber.js";
import type { BitcoinLikeNetworkParameters } from "./types";
import { BitcoinLikeFeePolicy, BitcoinLikeSigHashType } from "./types";

export const getNetworkParameters = (
  networkName: string
): BitcoinLikeNetworkParameters => {
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
  } else if (networkName === "bitcoin_testnet") {
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
      sigHash:
        BitcoinLikeSigHashType.SIGHASH_ALL |
        BitcoinLikeSigHashType.SIGHASH_FORKID,
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
      sigHash:
        BitcoinLikeSigHashType.SIGHASH_ALL |
        BitcoinLikeSigHashType.SIGHASH_FORKID,
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
  } else if (networkName === "peercoin") {
    return {
      identifier: "ppc",
      P2PKHVersion: Buffer.from([0x37]),
      P2SHVersion: Buffer.from([0x75]),
      xpubVersion: Buffer.from([0xe6, 0xe8, 0xe9, 0xe5]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "PPCoin Signed Message:\n",
      usesTimestampedTransaction: true,
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
  } else if (networkName === "hcash") {
    return {
      identifier: "hsr",
      P2PKHVersion: Buffer.from([0x28]),
      P2SHVersion: Buffer.from([0x78]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xc2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "HShare Signed Message:\n",
      usesTimestampedTransaction: true,
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
  } else if (networkName === "stealthcoin") {
    return {
      identifier: "xst",
      P2PKHVersion: Buffer.from([0x3e]),
      P2SHVersion: Buffer.from([0x55]),
      xpubVersion: Buffer.from([0x8f, 0x62, 0x4b, 0x66]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "StealthCoin Signed Message:\n",
      usesTimestampedTransaction: false,
      // Used to depend on "version"
      timestampDelay: new BigNumber(15),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "vertcoin") {
    return {
      identifier: "vtc",
      P2PKHVersion: Buffer.from([0x47]),
      P2SHVersion: Buffer.from([0x05]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "VertCoin Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "viacoin") {
    return {
      identifier: "via",
      P2PKHVersion: Buffer.from([0x47]),
      P2SHVersion: Buffer.from([0x21]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "ViaCoin Signed Message:\n",
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
  } else if (networkName === "stratis") {
    return {
      identifier: "strat",
      P2PKHVersion: Buffer.from([0x3f]),
      P2SHVersion: Buffer.from([0x7d]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xc2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Stratis Signed Message:\n",
      usesTimestampedTransaction: true,
      timestampDelay: new BigNumber(15),
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
  } else if (networkName === "poswallet") {
    return {
      identifier: "posw",
      P2PKHVersion: Buffer.from([0x37]),
      P2SHVersion: Buffer.from([0x55]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "PosWallet Signed Message:\n",
      usesTimestampedTransaction: true,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "pivx") {
    return {
      identifier: "pivx",
      P2PKHVersion: Buffer.from([0x1e]),
      P2SHVersion: Buffer.from([0x0d]),
      xpubVersion: Buffer.from([0x02, 0x2d, 0x25, 0x33]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "DarkNet Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  } else if (networkName === "clubcoin") {
    return {
      identifier: "club",
      P2PKHVersion: Buffer.from([0x1c]),
      P2SHVersion: Buffer.from([0x55]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Clubcoin Signed Message:\n",
      usesTimestampedTransaction: true,
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
  } else if (networkName === "stakenet") {
    return {
      identifier: "xsn",
      P2PKHVersion: Buffer.from([0x4c]),
      P2SHVersion: Buffer.from([0x10]),
      xpubVersion: Buffer.from([0x04, 0x88, 0xb2, 0x1e]),
      feePolicy: BitcoinLikeFeePolicy.PER_BYTE,
      dustAmount: new BigNumber(10000),
      messagePrefix: "Stakenet Signed Message:\n",
      usesTimestampedTransaction: false,
      timestampDelay: new BigNumber(0),
      sigHash: BitcoinLikeSigHashType.SIGHASH_ALL,
      additionalBIPs: [],
    };
  }

  throw new Error("No network parameters set for " + networkName);
};
