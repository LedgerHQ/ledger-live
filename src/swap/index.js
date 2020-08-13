// @flow

import type {
  SwapCurrencyNameAndSignature,
  SwapProviderNameAndSignature,
} from "./types";
import type { CryptoCurrency, TokenCurrency } from "../types/currencies";
import getExchangeRates from "./getExchangeRates";
import getStatus from "./getStatus";
import getProviders from "./getProviders";
import getCompleteSwapHistory from "./getCompleteSwapHistory";
import initSwap from "./initSwap";

const swapAPIBaseURL = "https://swap.staging.aws.ledger.fr";

const swapProviders: {
  [string]: { nameAndPubkey: Buffer, signature: Buffer },
} = {
  new_changelly: {
    nameAndPubkey: Buffer.from(
      "09535741505f5445535404660a150309fb52f3d42c27ad04dc3199aa2337bd2a8a002c5337d1788ae347d3336e00ea33f4778cd91ff7d28a8942efd7735dc3ad1b7453f1b9bd1fb4fe65fd",
      "hex"
    ),
    signature: Buffer.from(
      "3044022069ab98dfb8277f3622096d12485c92d314b554ab915f4cb110b66b6010d00af202202b6cc7f97969ee3c9ce788f88279e4821bac7d5aa4e71048e116020033efa69b",
      "hex"
    ),
  },
  changelly: {
    nameAndPubkey: Buffer.from(
      "094368616e67656c6c790480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b",
      "hex"
    ),
    signature: Buffer.from(
      "304402206a57c9ed4030cb2170a3457473757e063fe727c143000251d9e97f278990298002207b1197da75fe909cb9e285775af9c96a62695c1874565bc67b18f9f7c611de82",
      "hex"
    ),
  },
};

// Fixme These configuration/signature pairs will tell the swap app which currency app to open and sign with
// alongside which parameters (derivation path and so on). We should be able to generate this instead
const swapCurrencyConfigs: { [string]: SwapCurrencyNameAndSignature } = {
  bitcoin: {
    config: Buffer.from("0342544307426974636f696e00", "hex"),
    signature: Buffer.from(
      "3045022100cb174382302219dca359c0a4d457b2569e31a06b2c25c0088a2bd3fd6c04386a02202c6d0a5b924a414621067e316f021aa13aa5b2eee2bf36ea3cfddebc053b201b",
      "hex"
    ),
  },
  litecoin: {
    config: Buffer.from("034c5443084c697465636f696e00", "hex"),
    signature: Buffer.from(
      "304502210098f70ad7d757e3452ee297215be60ce01887cfab29f998113432823f94d35b88022031e1419cf1ce943401e57032528e3a99ec7d338665265dedf25beca45f4952fb",
      "hex"
    ),
  },
  ethereum: {
    config: Buffer.from("0345544808457468657265756d050345544812", "hex"),
    signature: Buffer.from(
      "3044022065d7931ab3144362d57e3fdcc5de921fb65024737d917f0ab1f8b173d1ed3c2e022027493568d112dc53c7177f8e5fc915d91a903780a067badf109085a73d360323",
      "hex"
    ),
  },
  "ethereum/erc20/usd_tether__erc20_": {
    config: Buffer.from("044555525408457468657265756d06044555525406", "hex"),
    signature: Buffer.from(
      "304402204de8f3a2e9ad2a9626c624fec8b8ec002a0008246b99549cb89b5eeb2c17ae0d022044753882f61ac80f1b43507682d22872c889cb3ee0271cf08d71e134ae6e091f",
      "hex"
    ),
  },
  "ethereum/erc20/augur": {
    config: Buffer.from("0352455008457468657265756d050352455012", "hex"),
    signature: Buffer.from(
      "3045022100b9733be71ede428a1f44066d3692614ddcfe453bf8b5ba0f7d8b4e5d5b02d1630220508cc7b8fa8ae970fecc968db2a30f65b9e3500d7452277dc65345a6a2d5e475",
      "hex"
    ),
  },
  "ethereum/erc20/omg": {
    config: Buffer.from("034f4d4708457468657265756d05034f4d4712", "hex"),
    signature: Buffer.from(
      "30440220087dd2c4b6c0e9e15e8619741d79bb79807cd555844e8a6494efe4a8f0a8e53d0220560417c280d36cee3a169655fd106ce955a81aaefdc43d7c6fd8c7236ddc7373",
      "hex"
    ),
  },
  "ethereum/erc20/0x_project": {
    config: Buffer.from("035a525808457468657265756d05035a525812", "hex"),
    signature: Buffer.from(
      "3045022100c9e8c9d3c3707d86599a8facf5ab00429174c8890f14fbc0c09ed6372fda8c6a022007384d445f8e10f03430becb98e6200188732c4617e4a61f48d68c5619a541b6",
      "hex"
    ),
  },
};

const getCurrencySwapConfig = (
  currency: CryptoCurrency | TokenCurrency
): SwapCurrencyNameAndSignature => {
  const res = swapCurrencyConfigs[currency.id];
  if (!res) {
    throw new Error(`Swap, missing configuration for ${currency.id}`);
  }
  return res;
};

const getProviderNameAndSignature = (
  providerName: string
): SwapProviderNameAndSignature => {
  const res = swapProviders[providerName];
  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }
  return res;
};

const isCurrencySwapSupported = (
  currency: CryptoCurrency | TokenCurrency
): boolean => {
  return !!swapCurrencyConfigs[currency.id];
};

export {
  swapAPIBaseURL,
  getProviderNameAndSignature,
  getProviders,
  getStatus,
  getCurrencySwapConfig,
  getExchangeRates,
  getCompleteSwapHistory,
  isCurrencySwapSupported,
  initSwap,
};
