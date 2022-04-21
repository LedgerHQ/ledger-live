/* eslint-disable no-fallthrough */
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import sha from "sha.js";
import { bufferToHex } from "ethereumjs-util";
import { getAccountBridge } from "../bridge";
import { getCryptoCurrencyById } from "../currencies";
import type { Account, Transaction } from "../types";
import type { TypedMessageData } from "../families/ethereum/types";
import { domainHash, messageHash } from "../families/ethereum/hw-signMessage";
import type { MessageData } from "../hw/signMessage/types";
export type WCPayloadTransaction = {
  from: string;
  to?: string;
  data: string;
  gas?: string;
  gasPrice?: string;
  value?: string;
  nonce?: string;
};
export type WCPayload = {
  method: string;
  params: any[];
  id: string;
};
export type WCCallRequest =
  | {
      type: "broadcast";
      data: string;
    }
  | {
      type: "message";
      data: MessageData | TypedMessageData;
    }
  | {
      type: "transaction";
      method: "send" | "sign";
      data: Transaction;
    };
type Parser = (arg0: Account, arg1: WCPayload) => Promise<WCCallRequest>;
export const parseCallRequest: Parser = async (account, payload) => {
  let wcTransactionData, bridge, transaction, message, rawMessage, hashes;

  switch (payload.method) {
    case "eth_sendRawTransaction":
      return {
        type: "broadcast",
        data: payload.params[0],
      };

    // @dev: Today, `eth_signTypedData` is versionned. We can't only check `eth_signTypedData`
    //       This regex matches `eth_signTypedData` and `eth_signTypedData_v[0-9]`
    case payload.method.match(/eth_signTypedData(_v.)?$/)?.input:
      message = JSON.parse(payload.params[1]);
      hashes = {
        // $FlowFixMe
        domainHash: bufferToHex(domainHash(message)),
        // $FlowFixMe
        messageHash: bufferToHex(messageHash(message)),
      };
    case "eth_sign":
      message = message || payload.params[1];
      rawMessage = rawMessage || payload.params[1];
      hashes = hashes || {
        stringHash:
          "0x" +
          sha("sha256")
            // $FlowFixMe
            .update(Buffer.from(payload.params[1].slice(2), "hex"))
            .digest("hex"),
      };
    case "personal_sign":
      message =
        message || Buffer.from(payload.params[0].slice(2), "hex").toString();
      rawMessage = rawMessage || payload.params[0];
      hashes = hashes || {
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
          rawMessage,
          currency: getCryptoCurrencyById("ethereum"),
          derivationMode: account.derivationMode,
          hashes,
        },
      };

    case "eth_signTransaction":
    case "eth_sendTransaction":
      wcTransactionData = payload.params[0] as WCPayloadTransaction;
      bridge = getAccountBridge(account);
      transaction = bridge.createTransaction(account);
      transaction = bridge.updateTransaction(transaction, {
        data: Buffer.from(wcTransactionData.data.slice(2), "hex"),
      });

      if (wcTransactionData.value) {
        transaction = bridge.updateTransaction(transaction, {
          amount: new BigNumber(wcTransactionData.value, 16),
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
          userGasLimit: new BigNumber(wcTransactionData.gas, 16),
        });
      }

      if (wcTransactionData.gasPrice) {
        transaction = bridge.updateTransaction(transaction, {
          gasPrice: new BigNumber(wcTransactionData.gasPrice, 16),
        });
      }

      if (wcTransactionData.nonce) {
        transaction = bridge.updateTransaction(transaction, {
          nonce: wcTransactionData.nonce,
        });
      }

      transaction = bridge.updateTransaction(transaction, {
        allowZeroAmount: true,
      });
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
