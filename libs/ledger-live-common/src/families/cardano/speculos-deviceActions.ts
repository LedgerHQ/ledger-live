import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";
import { getAccountStakeCredential, getBipPathString } from "./logic";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "New ordinary",
      },
      {
        title: "transaction?",
        button: "LRlr",
      },
      {
        title: "Auxiliary data hash",
        button: "LRlr",
      },
      {
        title: "Send to address",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Send",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Asset fingerprint",
        button: "LRlr",
      },
      {
        title: "Token amount",
        button: "LRlr",
      },
      {
        title: "Confirm",
      },
      {
        title: "output?",
        button: "Rr",
      },
      {
        title: "Transaction fee",
        button: "LRlr",
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Register",
      },
      {
        title: "staking key",
        button: "LRlr",
      },
      {
        title: "Staking key",
        button: "LRlr",
        expectedValue: ({ account }) => {
          const stakeCred = getAccountStakeCredential(
            account.xpub as string,
            account.index
          );
          const bipPath = getBipPathString({
            account: stakeCred.path.account,
            chain: stakeCred.path.chain,
            index: stakeCred.path.index,
          });
          return `m/${bipPath}`;
        },
      },
      {
        title: "Transaction TTL",
        button: "LRlr",
      },
      {
        title: "...",
      },
      {
        title: "registration?",
        button: "LRlr",
      },
      {
        title: "Delegate stake to",
        button: "LRlr",
      },
      {
        title: "delegation?",
        button: "LRlr",
      },
      {
        title: "transaction?",
        button: "LRlr",
        final: true,
      },
    ],
  });
