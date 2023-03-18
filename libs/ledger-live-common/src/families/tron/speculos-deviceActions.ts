import type { DeviceAction } from "../../bot/types";
import {
  deviceActionFlow,
  formatDeviceAmount,
  SpeculosButton,
} from "../../bot/specs";
import type { Transaction, Vote } from "./types";

function subAccount(subAccountId, account) {
  const sub = (account.subAccounts || []).find((a) => a.id === subAccountId);
  if (!sub || sub.type !== "TokenAccount")
    throw new Error("expected sub account id " + subAccountId);
  return sub;
}

const resourceExpected = ({ transaction: { resource } }) =>
  resource
    ? resource.slice(0, 1).toUpperCase() + resource.slice(1).toLowerCase()
    : "";

export const acceptTransaction: DeviceAction<Transaction, any> =
  deviceActionFlow({
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT, // TODO define expectedValue
      },
      {
        title: "Claim",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "Gain",
        button: SpeculosButton.RIGHT,
        expectedValue: (arg) => resourceExpected(arg),
      },
      {
        title: "Resource",
        button: SpeculosButton.RIGHT,
        expectedValue: (arg) => resourceExpected(arg),
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, status, transaction }) =>
          formatDeviceAmount(
            transaction.subAccountId
              ? subAccount(transaction.subAccountId, account).token
              : account.currency,
            status.amount,
            {
              hideCode: true,
            }
          ),
      },
      {
        title: "Token",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) => {
          const isTokenTransaction = Boolean(transaction.subAccountId);
          if (isTokenTransaction) {
            const token = subAccount(transaction.subAccountId, account).token;
            const [, tokenType, tokenId] = token.id.split("/");
            if (tokenType === "trc10") {
              return `${token.name.split(" ")[0]}[${tokenId}]`;
            } else {
              return token.ticker;
            }
          }
          return "TRX";
        },
      },
      {
        title: "From Address",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Freeze To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Delegated To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Send To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Sign",
        button: SpeculosButton.BOTH,
        final: true,
      },
    ],
    fallback: ({ event, transaction }) => {
      if (transaction.mode === "vote") {
        for (const vote of transaction.votes) {
          const title = `${vote.address.slice(0, 5)}...${vote.address.slice(
            vote.address.length - 5
          )}`;

          if (event.text === title) {
            return voteAction(vote, title);
          }
        }
      }
    },
  });

function voteAction(
  vote: Vote,
  title: string
): { title: string; button: SpeculosButton; expectedValue: () => string } {
  return {
    title,
    button: SpeculosButton.RIGHT,
    expectedValue: () => String(vote.voteCount),
  };
}
