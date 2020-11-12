// @flow
/* eslint-disable no-fallthrough */
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "../bridge";
import { getCryptoCurrencyById } from "../currencies";
import type { Account, Transaction } from "../types";
import type {
  TypedMessageData,
  TypedMessage,
} from "../families/ethereum/types";
import type { MessageData } from "../hw/signMessage/types";

export type WCPayload =
  | {
      method: "eth_signTransaction" | "eth_sendTransaction",
      params: [
        {
          from: string,
          to?: string,
          data: string,
          gas?: string,
          gasPrice?: string,
          value?: string,
          nonce?: string,
        }
      ],
      id: string,
    }
  | {
      method:
        | "eth_sendRawTransaction"
        | "eth_signTypedData"
        | "eth_sign"
        | "personal_sign",
      params: [string],
      id: string,
    };

export type WCCallRequest =
  | {
      type: "broadcast",
      data: string,
    }
  | {
      type: "message",
      data: MessageData | TypedMessageData,
    }
  | {
      type: "transaction",
      method: "send" | "sign",
      data: Transaction,
    };

type Parser = (Account, WCPayload) => Promise<WCCallRequest>;

export const parseCallRequest: Parser = async (account, payload) => {
  let wcTransactionData, bridge, transaction, message;

  switch (payload.method) {
    case "eth_sendRawTransaction":
      return {
        type: "broadcast",
        data: payload.params[0],
      };
    case "eth_signTypedData":
    case "eth_sign":
      // $FlowFixMe (pb with reverse)
      payload.params = payload.params.reverse();
    case "personal_sign":
      message =
        payload.method === "eth_signTypedData"
          ? (JSON.parse(payload.params[0]): TypedMessage)
          : Buffer.from(payload.params[0].slice(2), "hex").toString();
      return {
        type: "message",
        data: {
          path: account.freshAddressPath,
          // $FlowFixMe (can't figure out MessageData | TypedMessageData)
          message,
          currency: getCryptoCurrencyById("ethereum"),
          derivationMode: account.derivationMode,
        },
      };
    case "eth_signTransaction":
    case "eth_sendTransaction":
      wcTransactionData = payload.params[0];
      bridge = getAccountBridge(account);
      transaction = bridge.createTransaction(account);

      transaction = bridge.updateTransaction(transaction, {
        data: Buffer.from(wcTransactionData.data.slice(2), "hex"),
      });

      if (wcTransactionData.value) {
        transaction = bridge.updateTransaction(transaction, {
          amount: BigNumber(wcTransactionData.value, 16),
        });
      }
      if (wcTransactionData.to) {
        transaction = bridge.updateTransaction(transaction, {
          recipient: wcTransactionData.to,
        });
      }
      if (wcTransactionData.gas) {
        transaction = bridge.updateTransaction(transaction, {
          userGasLimit: BigNumber(wcTransactionData.gas, 16),
        });
      }
      if (wcTransactionData.gasPrice) {
        transaction = bridge.updateTransaction(transaction, {
          gasPrice: BigNumber(wcTransactionData.gasPrice, 16),
        });
      }
      if (wcTransactionData.nonce) {
        transaction = bridge.updateTransaction(transaction, {
          nonce: wcTransactionData.nonce,
        });
      }

      transaction = await bridge.prepareTransaction(account, transaction);

      return {
        type: "transaction",
        method: payload.method === "eth_signTransaction" ? "sign" : "send",
        data: transaction,
      };
    default:
      throw "wrong payload";
  }
};
