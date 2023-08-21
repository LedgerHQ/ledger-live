import network from "@ledgerhq/live-network/network";
import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById, parseCurrencyUnit } from "../../../currencies";
import { getEnv } from "../../../env";
import { retry } from "../../../promise";
import { NEW_ACCOUNT_ERROR_MESSAGE } from "../bridge/js";

const defaultEndpoint = () => getEnv("API_RIPPLE_RPC");

export const connectionTimeout = 30 * 1000; // default connectionTimeout is 2s and make the specs bot failed

const rippleUnit = getCryptoCurrencyById("ripple").units[0];

export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(rippleUnit, value);

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
  current?: boolean,
): Promise<AccountInfo> => {
  const res = async () => {
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
    if (
      res.data.result.status !== "success" &&
      res.data.result.error !== NEW_ACCOUNT_ERROR_MESSAGE
    ) {
      throw new Error(`couldn't fetch account info ${recipient}`);
    }

    return res.data.result;
  };

  return retry(() => res(), {
    maxRetry: getEnv("GET_CALLS_RETRY"),
  });
};

export const getServerInfo = async (endpointConfig?: string | null | undefined): Promise<any> => {
  const res = async () => {
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

    if (res.data.result.status !== "success") {
      throw new Error(`couldn't fetch server info`);
    }

    return res.data.result;
  };

  return retry(() => res(), {
    maxRetry: getEnv("GET_CALLS_RETRY"),
  });
};

export const getTransactions = async (address: string, options: any | undefined): Promise<any> => {
  const res = async () => {
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

    if (res.data.result.status !== "success") {
      throw new Error(`couldn't getTransactions for ${address}`);
    }
  };

  return retry(() => res(), {
    maxRetry: getEnv("GET_CALLS_RETRY"),
  });
};

export default async function getLedgerIndex(): Promise<number> {
  const res = async () => {
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

    if (ledgerResponse.data.result.status !== "success") {
      throw new Error(`couldn't fetch getLedgerIndex`);
    }

    return ledgerResponse.data.result.ledger_index;
  };
  return retry(() => res(), {
    maxRetry: getEnv("GET_CALLS_RETRY"),
  });
}
