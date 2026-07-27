import { BigNumber } from "bignumber.js";
import { firstValueFrom } from "rxjs";
import { concatMap, filter, map } from "rxjs/operators";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { SignedOperation, SignOperationEvent } from "@ledgerhq/types-live";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getErc20ApproveData } from "@ledgerhq/live-common/families/evm/getErc20ApproveData";
import { getEnv } from "@shared/env";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { parseCurrencyUnit } from "@ledgerhq/live-currency-format";
import { waitForTransactionConfirmation } from "@ledgerhq/live-common/families/evm/waitForConfirmation";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";

const modes = ["approve", "revokeApproval"] as const;
type Mode = (typeof modes)[number];

const UNLIMITED_APPROVAL_AMOUNT = 2n ** 256n - 1n;

function normalizeOptToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return undefined;
}

function inferMode(input?: string): Mode {
  const mode = modes.find(m => m === input);
  if (mode) return mode;
  throw new Error(`--mode <${modes.join(" | ")}> is required`);
}

function inferApprovedAmount(input: string | undefined, tokenCurrency: TokenCurrency): bigint {
  if (!input || input.trim() === "") {
    throw new Error(
      "--approveAmount <amount> is required for mode approve (e.g. 1000, 0.5, or unlimited).",
    );
  }
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "unlimited") return UNLIMITED_APPROVAL_AMOUNT;

  const amountBn = parseCurrencyUnit(tokenCurrency.units[0], trimmed);
  if (!amountBn.isInteger() || amountBn.isNegative()) {
    throw new Error(
      "--approveAmount must be a non-negative number in token units (e.g. 1000 or 0.5), or 'unlimited'.",
    );
  }
  return BigInt(amountBn.toFixed(0));
}

export type TokenApprovalJobOpts = ScanCommonOpts &
  Partial<{
    mode: string;
    token: string | string[];
    spender: string | string[];
    approveAmount: string;
    "disable-broadcast": boolean;
    "wait-confirmation": boolean;
    "wait-confirmation-timeout": number;
  }>;

export default {
  description: "set or revoke an ERC-20 token allowance for a spender (EVM only)",
  args: [
    ...scanCommonOpts,
    {
      name: "mode",
      type: String,
      desc: `${modes.join(" | ")}. revokeApproval sets the allowance to 0; approve sets a token allowance for a spender.`,
    },
    {
      name: "token",
      type: String,
      typeDesc: "tokenId",
      desc: "Token id (e.g. ethereum/erc20/usd__coin for USDC, ethereum/erc20/usd_tether__erc20_ for USDT)",
    },
    {
      name: "spender",
      type: String,
      typeDesc: "address",
      desc: "Spender address",
    },
    {
      name: "approveAmount",
      type: String,
      desc: "Amount to approve in token units, e.g. 1000, 0.5 or unlimited (required for mode approve).",
    },
    {
      name: "disable-broadcast",
      type: Boolean,
      desc: "do not broadcast the transaction",
    },
    {
      name: "wait-confirmation",
      type: Boolean,
      desc: "after broadcast, wait until the transaction is confirmed on-chain",
    },
    {
      name: "wait-confirmation-timeout",
      type: Number,
      desc: "max ms to wait for confirmation (default 120000)",
    },
  ],
  job: (opts: TokenApprovalJobOpts) =>
    scan(opts).pipe(
      concatMap(async account => {
        const mainAccount = getMainAccount(account);
        if (mainAccount.currency.family !== "evm") {
          throw new Error(
            `tokenApproval only supports EVM accounts. Account currency is ${mainAccount.currency.family}.`,
          );
        }

        const mode = inferMode(normalizeOptToString(opts.mode));
        const tokenId = normalizeOptToString(opts.token);
        const spender = normalizeOptToString(opts.spender);
        if (!tokenId) {
          throw new Error("--token <tokenId> is required (e.g. ethereum/erc20/usd__coin for USDC)");
        }
        if (!spender) {
          throw new Error("--spender <address> is required");
        }

        const tokenCurrency = await getCryptoAssetsStore().findTokenById(tokenId);
        if (!tokenCurrency) {
          throw new Error(`Token <${tokenId}> not found.`);
        }
        if (tokenCurrency.parentCurrencyId !== mainAccount.currency.id) {
          throw new Error(
            `Token ${tokenId} is not on ${mainAccount.currency.id}. Use a token for the account's chain.`,
          );
        }

        const amountApproved =
          mode === "revokeApproval" ? 0n : inferApprovedAmount(opts.approveAmount, tokenCurrency);
        const data = getErc20ApproveData(spender, amountApproved);

        const bridge = await getAccountBridge(mainAccount);
        const transaction = await bridge.prepareTransaction(mainAccount, {
          ...bridge.createTransaction(mainAccount),
          mode: "send",
          recipient: tokenCurrency.contractAddress,
          amount: new BigNumber(0),
          useAllAmount: false,
          data,
        });

        const status = await bridge.getTransactionStatus(mainAccount, transaction);
        const errorKeys = Object.keys(status.errors);
        if (errorKeys.length) {
          throw status.errors[errorKeys[0]];
        }

        if (opts["disable-broadcast"] || getEnv("DISABLE_TRANSACTION_BROADCAST")) {
          return JSON.stringify({ mode, tokenId, spender, broadcasted: false });
        }

        const signedOperation: SignedOperation = await firstValueFrom(
          bridge
            .signOperation({ account: mainAccount, transaction, deviceId: opts.device || "" })
            .pipe(
              filter(
                (e: SignOperationEvent): e is Extract<SignOperationEvent, { type: "signed" }> =>
                  e.type === "signed",
              ),
              map(e => e.signedOperation),
            ),
        );

        const op = await bridge.broadcast({ account: mainAccount, signedOperation });

        if (opts["wait-confirmation"] && op.hash) {
          const timeoutMs = opts["wait-confirmation-timeout"];
          await waitForTransactionConfirmation(
            mainAccount,
            op.hash,
            timeoutMs ? { timeoutMs } : {},
          );
        }

        return JSON.stringify({ mode, tokenId, spender, broadcasted: true, hash: op.hash });
      }),
    ),
};
