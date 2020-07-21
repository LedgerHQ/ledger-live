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
      "304502210097ce38c51560fdbf2dbe873c22fcbec07b58f13313245e8fb64fdb2b32d455e002200ae63cda3cd3cc0343653b38e5c2c5c27bfe47b35d2530263789634759c6d5b4",
      "hex"
    ),
  },
  litecoin: {
    config: Buffer.from("034c5443084c697465636f696e00", "hex"),
    signature: Buffer.from(
      "304402202ad561dd8b3b989cea411d4c1d8a6a6271b4f72fb166259c898ffc11707472eb0220346aa8955e8e6be65d2fc658363af431d71ea865ccc83dd4a7149beff93521b8",
      "hex"
    ),
  },
  ethereum: {
    config: Buffer.from("0345544808457468657265756d050345544812", "hex"),
    signature: Buffer.from(
      "304402205fef555436ace6768ba6666ab7834b1687369b06274778fdd28e0b88d3434de902206a67f4cf622c6bbc127bbe866a7b6540bd97e91acb38f179a554e694bdea5043",
      "hex"
    ),
  },
  "ethereum/erc20/usd_tether__erc20_": {
    config: Buffer.from("045553445408457468657265756d06045553445406", "hex"),
    signature: Buffer.from(
      "3045022100d77562b48a7e563b014a1c120a2071697e1d820e0755188f321bd364d9bf17990220509d757a7fc477a3e5599540c7010fadabaac273530b428178996f7d20febb65",
      "hex"
    ),
  },
  "ethereum/erc20/augur": {
    config: Buffer.from("0352455008457468657265756d050352455012", "hex"),
    signature: Buffer.from(
      "3045022100b6895433a4443c78c344da457fdcd4974534a6cc9858cf189243df783484131602203b3ae7ad8b17f825e55552ea18ac1ecdc30099f12931a144d163c70aa2defd8b",
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
