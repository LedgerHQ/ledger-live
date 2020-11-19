// @flow
import { BigNumber } from "bignumber.js";
import {
  parseCurrencyUnit,
  getCryptoCurrencyById,
  formatCurrencyUnit,
} from "../currencies";

const rippleUnit = getCryptoCurrencyById("ripple").units[0];

export const defaultEndpoint = "wss://xrpl.ws";
export const connectionTimeout = 30 * 1000; // default connectionTimeout is 2s and make the specs bot failed

export const apiForEndpointConfig = (
  RippleAPI: *, // you must provide {RippleAPI} from "ripple-lib"
  endpointConfig: ?string = null
) => {
  const server = endpointConfig || defaultEndpoint;
  const api = new RippleAPI({ server });

  // https://github.com/ripple/ripple-lib/issues/1196#issuecomment-583156895
  // We can't add connectionTimeout to the constructor
  // We need to add this config to allow the bot to not timeout on github action
  // but it will throw a 'additionalProperty "connectionTimeout" exists'
  // during the preparePayment
  api.connection._config.connectionTimeout = connectionTimeout;

  api.on("error", (errorCode, errorMessage) => {
    console.warn(`Ripple API error: ${errorCode}: ${errorMessage}`);
  });
  return api;
};

export const parseAPIValue = (value: string) =>
  parseCurrencyUnit(rippleUnit, value);

export const parseAPICurrencyObject = ({
  currency,
  value,
}: {
  currency: string,
  value: string,
}) => {
  if (currency !== "XRP") {
    console.warn(`RippleJS: attempt to parse unknown currency ${currency}`);
    return BigNumber(0);
  }
  return parseAPIValue(value);
};

export const formatAPICurrencyXRP = (amount: BigNumber) => {
  const value = formatCurrencyUnit(rippleUnit, amount, {
    showAllDigits: true,
    disableRounding: true,
    useGrouping: false,
  });
  return { currency: "XRP", value };
};
