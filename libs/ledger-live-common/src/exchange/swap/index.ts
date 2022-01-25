import type { ExchangeProviderNameAndSignature } from "../";
import getExchangeRates from "./getExchangeRates";
import getStatus from "./getStatus";
import getProviders from "./getProviders";
import getCompleteSwapHistory from "./getCompleteSwapHistory";
import getKYCStatus from "./getKYCStatus";
import submitKYC from "./submitKYC";
import initSwap from "./initSwap";
import { getEnv } from "../../env";
import {
  JSONRPCResponseError,
  JSONDecodeError,
  NoIPHeaderError,
  CurrencyNotSupportedError,
  CurrencyDisabledError,
  CurrencyDisabledAsInputError,
  CurrencyDisabledAsOutputError,
  CurrencyNotSupportedByProviderError,
  TradeMethodNotSupportedError,
  UnexpectedError,
  NotImplementedError,
  ValidationError,
  AccessDeniedError,
} from "../../errors";

export const operationStatusList = {
  finishedOK: ["finished"],
  finishedKO: ["refunded"],
  pending: ["pending", "onhold", "expired"],
};

const getSwapAPIBaseURL: () => string = () => getEnv("SWAP_API_BASE");

const swapProviders: Record<
  string,
  {
    nameAndPubkey: Buffer;
    signature: Buffer;
    curve: string;
    needsKYC: boolean;
  }
> = {
  changelly: {
    nameAndPubkey: Buffer.from(
      "094368616e67656c6c790480d7c0d3a9183597395f58dda05999328da6f18fabd5cda0aff8e8e3fc633436a2dbf48ecb23d40df7c3c7d3e774b77b4b5df0e9f7e08cf1cdf2dba788eb085b",
      "hex"
    ),
    signature: Buffer.from(
      "3045022100e73339e5071b5d232e8cacecbd7c118c919122a43f8abb8b2062d4bfcd58274e022050b11605d8b7e199f791266146227c43fd11d7645b1d881f705a2f8841d21de5",
      "hex"
    ),
    curve: "secpk256k1",
    needsKYC: false,
  },
  wyre: {
    nameAndPubkey: Buffer.from(
      "045779726504AD01A6241929A5EC331046868FBACB424696FD7C8A4D824FEE61268374E9F4F87FFC5301F0E0A84CEA69FFED46E14C771F9CA1EEA345F6531994291C816E8AE6",
      "hex"
    ),
    signature: Buffer.from(
      "304402207b49e46d458a55daee9bc8ed96e1b404c2d99dbbc3d3c3c15430026eb7e01a05022011ab86db08a4c956874a83f23d918319a073fdd9df23a1c7eed8a0a22c98b1e3",
      "hex"
    ),
    curve: "secpk256k1",
    needsKYC: true,
  },
};

const getProviderNameAndSignature = (
  providerName: string
): ExchangeProviderNameAndSignature => {
  const res = swapProviders[providerName.toLowerCase()];

  if (!res) {
    throw new Error(`Unknown partner ${providerName}`);
  }

  return res;
};

const USStates = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District Of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const countries = {
  US: "United States",
};

const swapBackendErrorCodes = {
  "100": JSONRPCResponseError,
  "101": JSONDecodeError,
  "200": NoIPHeaderError,
  "300": CurrencyNotSupportedError,
  "301": CurrencyDisabledError,
  "302": CurrencyDisabledAsInputError,
  "303": CurrencyDisabledAsOutputError,
  "304": CurrencyNotSupportedByProviderError,
  "400": TradeMethodNotSupportedError,
  "500": UnexpectedError,
  "600": NotImplementedError,
  "700": ValidationError,
  "701": AccessDeniedError,
};

export const getSwapAPIError = (errorCode: number, errorMessage?: string) => {
  if (errorCode in swapBackendErrorCodes)
    return new swapBackendErrorCodes[errorCode](errorMessage);
  return new Error(errorMessage);
};

export {
  getSwapAPIBaseURL,
  getProviderNameAndSignature,
  getProviders,
  getStatus,
  getExchangeRates,
  getCompleteSwapHistory,
  initSwap,
  getKYCStatus,
  submitKYC,
  USStates,
  countries,
};
