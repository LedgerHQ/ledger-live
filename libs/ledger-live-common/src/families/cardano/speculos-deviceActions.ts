import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { getAccountStakeCredential, getBipPathString } from "./logic";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "New ordinary",
      },
      {
        title: "transaction?",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Auxiliary data hash",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Send to address",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Send",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.amount),
      },
      {
        title: "Asset fingerprint",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Token amount",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Confirm",
      },
      {
        title: "output?",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Transaction fee",
        button: SpeculosButton.BOTH,
        ignoreAssertionFailure: true,
        expectedValue: ({ account, status }) =>
          formatDeviceAmount(account.currency, status.estimatedFees),
      },
      {
        title: "Register",
      },
      {
        title: "staking key",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Staking key",
        button: SpeculosButton.BOTH,
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
        button: SpeculosButton.BOTH,
      },
      {
        title: "...",
      },
      {
        title: "registration?",
        button: SpeculosButton.BOTH,
      },
      {
        title: "Delegate stake to",
        button: SpeculosButton.BOTH,
      },
      {
        title: "delegation?",
        button: SpeculosButton.BOTH,
      },
      {
        title: "transaction?",
        final: true,
        button: SpeculosButton.RIGHT,
      },
    ],
  });
