import { BigNumber } from "bignumber.js";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import type { Account, DerivationMode } from "@ledgerhq/types-live";
import {
  formatCurrencyUnit,
  findCryptoCurrencyByKeyword,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";
import {
  encodeAccountId,
  decodeAccountId,
  emptyHistoryCache,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  asDerivationMode,
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { getEvmTokenAllowance } from "@ledgerhq/live-common/families/evm/getTokenAllowance";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";

function normalizeOptToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") return value[0];
  return undefined;
}

function buildMinimalEvmAccountFromOwnerAddress(params: {
  currencyId: string;
  address: string;
  derivationMode: DerivationMode;
  index?: number;
}): Account {
  const { currencyId, address, derivationMode, index = 0 } = params;

  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId,
    xpubOrAddress: address.trim(),
    derivationMode,
  });

  const { derivationMode: dm, xpubOrAddress, currencyId: decodedCurrencyId } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(decodedCurrencyId);
  const resolvedDerivationMode = asDerivationMode(dm);
  const derivationScheme = getDerivationScheme({
    derivationMode: resolvedDerivationMode,
    currency,
  });
  const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    id,
    derivationMode: resolvedDerivationMode,
    currency,
    index,
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
  };
}

function formatAllowanceOutput(
  opts: { format: string },
  result: Awaited<ReturnType<typeof getEvmTokenAllowance>>,
): string {
  const formatted = formatCurrencyUnit(result.unit, result.allowance, {
    showCode: true,
    disableRounding: true,
  });

  if (opts.format === "json") {
    return JSON.stringify({
      allowance: result.allowance.toFixed(0),
      allowanceFormatted: formatted,
      symbol: result.symbol,
      tokenId: result.tokenId,
      owner: result.owner,
      spender: result.spender,
      contractAddress: result.contractAddress,
    });
  }

  return [
    `Token: ${result.symbol} (${result.tokenId})`,
    `Owner: ${result.owner}`,
    `Spender: ${result.spender}`,
    `Allowance: ${formatted}`,
    `Raw (wei): ${result.allowance.toFixed(0)}`,
  ].join("\n");
}

export type TokenAllowanceJobOpts = ScanCommonOpts & {
  token: string | string[];
  spender: string | string[];
  format: string;
  ownerAddress?: string | string[];
};

export default {
  description: "check ERC-20 token approval status (allowance) for an EVM account",
  args: [
    ...scanCommonOpts,
    {
      name: "ownerAddress",
      type: String,
      typeDesc: "address",
      desc: "EVM account owner address (on-chain read only; no device or app.json). Requires --currency.",
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
      desc: "Spender address to check allowance for",
    },
    {
      name: "format",
      type: String,
      desc: "output format: default | json",
    },
  ],
  job: (opts: TokenAllowanceJobOpts) => {
    const tokenId = normalizeOptToString(opts.token);
    const spender = normalizeOptToString(opts.spender);
    const ownerAddress = normalizeOptToString(opts.ownerAddress);

    if (!tokenId) {
      throw new Error(
        "--token <tokenId> is required (e.g. ethereum/erc20/usd_tether__erc20_ for USDT)",
      );
    }
    if (!spender) {
      throw new Error("--spender <address> is required");
    }

    if (ownerAddress) {
      const currencyKeyword = normalizeOptToString(opts.currency);
      if (!currencyKeyword) {
        throw new Error("--currency is required when using --ownerAddress");
      }
      const currencyFromKeyword = findCryptoCurrencyByKeyword(currencyKeyword);
      if (!currencyFromKeyword) {
        throw new Error(`Unknown currency: ${currencyKeyword}`);
      }
      if (currencyFromKeyword.family !== "evm") {
        throw new Error(
          `tokenAllowance only supports EVM chains with --ownerAddress. Got family ${currencyFromKeyword.family}.`,
        );
      }
      const accountIndex =
        typeof opts.index === "number"
          ? opts.index
          : opts.index !== undefined
            ? Number.parseInt(String(opts.index), 10)
            : 0;
      const mainAccount = buildMinimalEvmAccountFromOwnerAddress({
        currencyId: currencyFromKeyword.id,
        address: ownerAddress,
        derivationMode: asDerivationMode(opts.scheme ?? ""),
        index: Number.isFinite(accountIndex) ? accountIndex : 0,
      });
      return from(
        getEvmTokenAllowance(mainAccount, tokenId, spender).then(result =>
          formatAllowanceOutput(opts, result),
        ),
      );
    }

    return scan(opts).pipe(
      concatMap(account => {
        const mainAccount = getMainAccount(account);
        if (mainAccount.currency.family !== "evm") {
          throw new Error(
            `tokenAllowance only supports EVM accounts. Account currency is ${mainAccount.currency.family}. Use --currency ethereum (or another EVM chain).`,
          );
        }
        return from(
          getEvmTokenAllowance(mainAccount, tokenId, spender).then(result =>
            formatAllowanceOutput(opts, result),
          ),
        );
      }),
    );
  },
};
