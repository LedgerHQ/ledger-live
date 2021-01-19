// @flow
/* eslint-disable no-fallthrough */
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import sha from "sha.js";
import { bufferToHex } from "ethereumjs-util";
import { getAccountBridge } from "../bridge";
import { getCryptoCurrencyById } from "../currencies";
import type { Account, Transaction } from "../types";
import type {
  TypedMessageData,
  TypedMessage,
} from "../families/ethereum/types";
import { domainHash, messageHash } from "../families/ethereum/hw-signMessage";
import type { MessageData } from "../hw/signMessage/types";

export type WCPayloadTransaction = {
  from: string,
  to?: string,
  data: string,
  gas?: string,
  gasPrice?: string,
  value?: string,
  nonce?: string,
};

export type WCPayload = {
  method: string,
  params: any[],
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
  let wcTransactionData, bridge, transaction, message, hashes;

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
      hashes =
        payload.method === "eth_signTypedData"
          ? {
              // $FlowFixMe
              domainHash: bufferToHex(domainHash(message)),
              // $FlowFixMe
              messageHash: bufferToHex(messageHash(message)),
            }
          : {
              stringHash:
                "0x" +
                sha("sha256")
                  // $FlowFixMe
                  .update(message)
                  .digest("hex"),
            };
      return {
        type: "message",
        // $FlowFixMe (can't figure out MessageData | TypedMessageData)
        data: {
          path: account.freshAddressPath,
          message,
          currency: getCryptoCurrencyById("ethereum"),
          derivationMode: account.derivationMode,
          hashes,
        },
      };
    case "eth_signTransaction":
    case "eth_sendTransaction":
      wcTransactionData = (payload.params[0]: WCPayloadTransaction);
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
        let to = wcTransactionData.to;
        if (to.toLowerCase() === to) {
          to = eip55.encode(to);
        }
        transaction = bridge.updateTransaction(transaction, {
          recipient: to,
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
      throw new Error("wrong payload");
  }
};
