import type { DeviceAction } from "../../bot/types";
import { deviceActionFlow, formatDeviceAmount } from "../../bot/specs";
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
        button: "Rr", // TODO define expectedValue
      },
      {
        title: "Claim",
        button: "Rr",
      },
      {
        title: "Gain",
        button: "Rr",
        expectedValue: (arg) => resourceExpected(arg),
      },
      {
        title: "Resource",
        button: "Rr",
        expectedValue: (arg) => resourceExpected(arg),
      },
      {
        title: "Amount",
        button: "Rr",
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
        button: "Rr",
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
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Freeze To",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Delegated To",
        button: "Rr",
        expectedValue: ({ account }) => account.freshAddress,
      },
      {
        title: "Send To",
        button: "Rr",
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Sign",
        button: "LRlr",
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
): { title: string; button: string; expectedValue: () => string } {
  return {
    title,
    button: "Rr",
    expectedValue: () => String(vote.voteCount),
  };
}
