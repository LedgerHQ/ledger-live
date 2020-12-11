// @flow
import { BigNumber } from "bignumber.js";
import {
  parseCurrencyUnit,
  getCryptoCurrencyById,
  formatCurrencyUnit,
} from "../currencies";
import { getEnv } from "../env";
import { RippleAPI } from "ripple-lib";

type AsyncApiFunction = (api: typeof RippleAPI) => Promise<any>;
type XRPAmount = { currency: string, value: string };
type XRPPayment = {
  source: { address: string, amount: XRPAmount },
  destination: { address: string, minAmount: XRPAmount, tag: ?number },
};
type XRPInstruction = { fee: string, maxLedgerVersionOffset: number };
type XRPTxOption = {
  minLedgerVersion: number,
  maxLedgerVersion: number,
  types: Array<string>,
};

const rippleUnit = getCryptoCurrencyById("ripple").units[0];
const defaultEndpoint = () => getEnv("API_RIPPLE_WS");
export const connectionTimeout = 30 * 1000; // default connectionTimeout is 2s and make the specs bot failed
const WEBSOCKET_DEBOUNCE_DELAY = 30000;

let api;
let pendingQueries = [];
let apiDisconnectTimeout;

/**
 * Connects to Substrate Node, executes calls then disconnects
 *
 * @param {*} execute - the calls to execute on api
 */
async function withApi(
  execute: AsyncApiFunction,
  endpointConfig: ?string = null
): Promise<any> {
  const server = endpointConfig || defaultEndpoint();
  // If client is instanciated already, ensure it is connected & ready
  if (api) {
    try {
      if (!(await api.isConnected)) {
        throw new Error("XRP WS is not connected");
      }
    } catch (err) {
      // definitely not connected...
      api = null;
      pendingQueries = [];
    }
  }

  if (!api) {
    api = new RippleAPI({ server });

    // https://github.com/ripple/ripple-lib/issues/1196#issuecomment-583156895
    // We can't add connectionTimeout to the constructor
    // We need to add this config to allow the bot to not timeout on github action
    // but it will throw a 'additionalProperty "connectionTimeout" exists'
    // during the preparePayment
    api.connection._config.connectionTimeout = connectionTimeout;

    api.on("error", (errorCode, errorMessage) => {
      console.warn(`Ripple API error: ${errorCode}: ${errorMessage}`);
    });

    await api.connect();
  }

  cancelDebouncedDisconnect();

  try {
    const query = execute(api);
    pendingQueries.push(query.catch((err) => err));
    const res = await query;

    return res;
  } finally {
    debouncedDisconnect();
  }
}

/**
 * Disconnects Websocket API client after all pending queries are flushed.
 */
export const disconnect = async () => {
  cancelDebouncedDisconnect();

  if (api) {
    const disconnecting = api;
    const pending = pendingQueries;
    api = undefined;
    pendingQueries = [];
    await Promise.all(pending);
    await disconnecting.disconnect();
  }
};

const cancelDebouncedDisconnect = () => {
  if (apiDisconnectTimeout) {
    clearTimeout(apiDisconnectTimeout);
    apiDisconnectTimeout = null;
  }
};

/**
 * Disconnects Websocket client after a delay.
 */
const debouncedDisconnect = () => {
  cancelDebouncedDisconnect();
  apiDisconnectTimeout = setTimeout(disconnect, WEBSOCKET_DEBOUNCE_DELAY);
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

export const preparePayment = async (
  address: string,
  payment: XRPPayment,
  instruction: XRPInstruction
): Promise<*> =>
  withApi(async (api: typeof RippleAPI) => {
    return api.preparePayment(address, payment, instruction);
  });

export const submit = async (signature: string): Promise<*> =>
  withApi(async (api: typeof RippleAPI) => {
    return api.request("submit", { tx_blob: signature });
  });

// endpointConfig does not seem to be undestood by linter
/* eslint-disable no-unused-vars */
export const getAccountInfo = async (
  recipient: string,
  endpointConfig: ?string
): Promise<*> =>
  withApi(async (api: typeof RippleAPI, endpointConfig) => {
    return api.getAccountInfo(recipient);
  });

export const getServerInfo = async (endpointConfig: ?string): Promise<*> =>
  withApi(async (api: typeof RippleAPI, endpointConfig) => {
    return api.getServerInfo();
  });
/* eslint-enable no-unused-vars */

export const getTransactions = async (address: string, options: ?XRPTxOption) =>
  withApi(async (api: typeof RippleAPI) => {
    return api.getTransactions(address, options);
  });
