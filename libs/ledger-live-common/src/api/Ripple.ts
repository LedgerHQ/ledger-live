import { BigNumber } from "bignumber.js";
import { getEnv } from "../env";
import network from "../network";
import { parseCurrencyUnit, getCryptoCurrencyById } from "../currencies";

const defaultEndpoint = () => getEnv("API_RIPPLE_RPC");

export const connectionTimeout = 30 * 1000; // default connectionTimeout is 2s and make the specs bot failed

const rippleUnit = getCryptoCurrencyById("ripple").units[0];

export const parseAPIValue = (value: string): BigNumber =>
  parseCurrencyUnit(rippleUnit, value);

export const submit = async (signature: string): Promise<any> => {
  const res = await network({
    method: "POST",
    url: `${defaultEndpoint()}`,
    data: {
      method: "submit",
      params: [
        {
          tx_blob: signature,
        },
      ],
    },
  });
  return res.data.result;
};

type AccountInfo = {
  account_data: {
    Account: string;
    Balance: string;
    Flags: number;
    LedgerEntryType: string;
    OwnerCount: number;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    index: string;
  };
  error: string;
};

export const getAccountInfo = async (
  recipient: string,
  current?: boolean
): Promise<AccountInfo> => {
  const res = await network({
    method: "POST",
    url: `${defaultEndpoint()}`,
    data: {
      method: "account_info",
      params: [
        {
          account: recipient,
          ledger_index: current ? "current" : "validated",
        },
      ],
    },
  });
  return res.data.result;
};

export const getServerInfo = async (
  endpointConfig?: string | null | undefined
): Promise<any> => {
  const res = await network({
    method: "POST",
    url: endpointConfig ?? `${defaultEndpoint()}`,
    data: {
      method: "server_info",
      params: [
        {
          ledger_index: "validated",
        },
      ],
    },
  });

  return res.data.result;
};

export const getTransactions = async (
  address: string,
  options: any | undefined
): Promise<any> => {
  const res = await network({
    method: "POST",
    url: `${defaultEndpoint()}`,
    data: {
      method: "account_tx",
      params: [
        {
          account: address,
          ledger_index: "validated",
          ...options,
        },
      ],
    },
  });
  return res.data.result.transactions;
};

export default async function getLedgerIndex(): Promise<number> {
  const ledgerResponse = await network({
    method: "POST",
    url: `${defaultEndpoint()}`,
    data: {
      method: "ledger",
      params: [
        {
          ledger_index: "validated",
        },
      ],
    },
  });
  return ledgerResponse.data.result.ledger_index;
}
