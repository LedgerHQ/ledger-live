import { createClient } from "@kadena/client";
import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../config";
import { KDA_CHAINWEB_VER, KDA_NETWORK } from "../constants";
import { PactCommandObject } from "../hw-app-kda/Kadena";
import { KadenaOperation } from "../types";
import {
  ChainAccount,
  ErrorResponse,
  Event,
  GetAccountBalanceResponse,
  GetChainAccountResponse,
  GetEvents,
  GetTransfers,
  GraphQLResponse,
  LastBlockHeight,
  Transfer,
} from "./types";

const getKadenaURL = (): string => {
  const currencyConfig = getCoinConfig();

  return currencyConfig.infra.API_KADENA_ENDPOINT;
};

export const getKadenaPactURL = (chainId: string): string => {
  const currencyConfig = getCoinConfig();

  return `${currencyConfig.infra.API_KADENA_PACT_ENDPOINT}/chainweb/${KDA_CHAINWEB_VER}/${KDA_NETWORK}/chain/${chainId}/pact`;
};

const send = async <T>(path: string, data: string) => {
  const currencyConfig = getCoinConfig();

  const { data: dataResponse } = await network<GraphQLResponse<T>>({
    method: "POST",
    url: path,
    data: { query: data },
    headers: {
      "Content-Type": "application/json",
      "x-api-key": currencyConfig.infra.API_KEY_KADENA_ENDPOINT,
    },
  });

  if (dataResponse.errors?.length) {
    const errorMessage = dataResponse.errors
      .map((error: ErrorResponse) => error.message)
      .join(", ");
    throw Error(`API responded with errors: ${errorMessage}`);
  }
  return dataResponse.data;
};

export const fetchAccountBalance = async (address: string) => {
  const query = `query Query {
      fungibleAccount(
        accountName: "${address}"
      ) {
        totalBalance
      }
  }`;
  const res = await send<GetAccountBalanceResponse>(getKadenaURL(), query);
  const balance = res.fungibleAccount?.totalBalance;

  return balance ?? 0;
};

export const fetchChainBalances = async (address: string): Promise<ChainAccount[]> => {
  const query = `query Query {
      fungibleAccount(
        accountName: "${address}"
      ) {
        chainAccounts {
          balance,
          chainId
        }
      }
  }`;
  const res = await send<GetChainAccountResponse>(getKadenaURL(), query);
  const balance = res.fungibleAccount?.chainAccounts;

  return balance ?? [];
};

export const fetchBlockHeight = async (): Promise<number | undefined> => {
  const query = `query Query {
    lastBlockHeight
  }`;
  const res = await send<LastBlockHeight>(getKadenaURL(), query);
  const height = res.lastBlockHeight;

  return height;
};

export const fetchTransactions = async (
  address: string,
  minBlockHeight?: number,
): Promise<Transfer[]> => {
  const result: Transfer[] = [];
  let isFirstFetch: boolean = true;
  let hasNext: boolean = false;
  let cursor: string | undefined;

  while (isFirstFetch || (hasNext && cursor)) {
    const query: string = `query Query {
        transfers(accountName: "${address}"${hasNext ? `, after: "${cursor}"` : ""}){
          edges {
            node {
              amount
              block {
                creationTime
                height
                hash
                chainId
              }
              creationTime
              receiverAccount
              senderAccount
              requestKey
              moduleName
              crossChainTransfer {
                amount
                receiverAccount
                senderAccount
                block {
                  chainId
                }
              }
              transaction {
                result {
                  ...on TransactionResult {
                    badResult,
                    goodResult,
                    gas,
                  }
                }
                cmd {
                  signers {
                    clist {
                      args
                      name
                    }
                  }
                }
              }
            }
          }
          totalCount  
          pageInfo {
            hasNextPage,
            endCursor
          }
        }
      }
    `;

    const res = await send<GetTransfers>(getKadenaURL(), query);

    const transfers = res.transfers.edges.map(({ node }) => node);
    if (transfers.length !== 0) {
      result.push(...transfers);
      if (minBlockHeight) {
        // Check if any transaction has block height less than minBlockHeight
        const hasOldTransaction = transfers.some(tx => tx.block.height < minBlockHeight);
        if (hasOldTransaction) {
          break;
        }
      }
    }

    isFirstFetch = false;
    hasNext = res.transfers.pageInfo?.hasNextPage ?? false;
    cursor = hasNext ? res.transfers.pageInfo?.endCursor : undefined;
  }

  return result;
};

export const fetchEvents = async (eventName: string, requestKey: string): Promise<Event[]> => {
  const query = `query Query {
    events(qualifiedEventName: "${eventName}", requestKey: "${requestKey}") {
      edges {
        node {
          name
          parameters
        }
      }
    }
}`;
  const res = await send<GetEvents>(getKadenaURL(), query);
  const events = res.events.edges.map(({ node }) => node);

  return events;
};

export const broadcastTransaction = async (cmd: PactCommandObject, op: KadenaOperation) => {
  const id = op.extra.senderChainId;

  const client = createClient(getKadenaPactURL(id.toString()));
  try {
    const res = await client.local(cmd);
    if (res.result.status === "failure") {
      throw new Error(
        "message" in res.result.error
          ? (res.result.error.message as string)
          : "dry run for the transaction failed",
      );
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err?.message;
    }
    if (typeof err === "string") {
      throw err;
    }
    throw err;
  }

  await client.submit(cmd);
};
