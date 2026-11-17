import BigNumber from "bignumber.js";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { createAccountNotFound, ServerError } from "@ledgerhq/wallet-api-core";
import {
  TRONIFY_GET_QUOTE_METHOD,
  TRONIFY_IS_ENERGY_DELIVERED_METHOD,
  type GetTronifyQuoteParams,
  type GetTronifyQuoteResult,
  type IsTronifyEnergyDeliveredParams,
  type IsTronifyEnergyDeliveredResult,
} from "@ledgerhq/wallet-api-exchange-module";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { buildGenericTransactionIntent } from "../../bridge/generic-coin-framework/buildIntent";
import {
  getSponsoredCoinApi,
  type SponsoredCoinApi,
  type SponsoredFeeAsset,
} from "../../bridge/generic-coin-framework/sponsored";
import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";
import { genericValidateAddress } from "../../bridge/generic-coin-framework/validateAddress";
import { getAccountIdFromWalletAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import {
  createAccounIdNotFound,
  createTronifyDisabled,
  createTronifyQuoteFailed,
  createTronifyUnavailable,
  createTronifyUnsupportedAccount,
  createTronifyUnsupportedTransfer,
  createWrongTronifyParams,
  ExchangeError,
} from "./error";

type TronifyDeps = {
  accounts: AccountLike[];
  getFeature?: GetFeatureFn;
};

const SEAM_KIND = "local";

const POSITIVE_INTEGER = /^[1-9]\d*$/;

type TronSender = { payer: Account; tokenAccount: TokenAccount };

/** The TRC-20 token account that sends, and the TRON account behind it that holds the energy. */
function resolveTronSender(fromAccountId: string, accounts: AccountLike[]): TronSender {
  const accountId = getAccountIdFromWalletAccountId(fromAccountId);
  if (!accountId) throw new ExchangeError(createAccounIdNotFound(fromAccountId));

  const account = accounts.find(acc => acc.id === accountId);
  if (!account) throw new ServerError(createAccountNotFound(fromAccountId));

  // Only a TRC-20 transfer consumes energy, so a native TRX or TRC-10 account has nothing to rent.
  // The parent is looked up directly: `getParentAccount` throws an untyped error when it is missing.
  const parent =
    account.type === "TokenAccount"
      ? accounts.find(
          (acc): acc is Account => acc.type === "Account" && acc.id === account.parentId,
        )
      : undefined;
  if (
    account.type !== "TokenAccount" ||
    account.token.tokenType !== "trc20" ||
    parent?.currency.family !== "tron"
  ) {
    throw new ExchangeError(createTronifyUnsupportedAccount(fromAccountId));
  }
  return { payer: parent, tokenAccount: account };
}

function assertTronifyEnabled(getFeature: GetFeatureFn | undefined): void {
  if (getFeature?.("gasSponsorship")?.enabled !== true) {
    throw new ExchangeError(createTronifyDisabled());
  }
}

async function loadTronifySeam(payer: Account): Promise<SponsoredCoinApi> {
  const seam = await getSponsoredCoinApi(payer.currency.id, SEAM_KIND);
  if (!seam) throw new ExchangeError(createTronifyUnavailable());
  return seam;
}

function isTransferParams(
  params: GetTronifyQuoteParams | undefined,
): params is GetTronifyQuoteParams {
  return (
    !!params &&
    typeof params.fromAccountId === "string" &&
    typeof params.recipient === "string" &&
    params.recipient !== "" &&
    typeof params.amount === "string" &&
    POSITIVE_INTEGER.test(params.amount)
  );
}

/** The TRC-20 send intent the Send flow would build for the same transfer. */
async function buildTransferIntent(
  { payer, tokenAccount }: TronSender,
  { recipient, amount }: GetTronifyQuoteParams,
): Promise<unknown> {
  // Checked locally: an invalid address otherwise surfaces as an opaque decode error mid-estimate.
  const isValid = await genericValidateAddress(payer.currency.id, SEAM_KIND)(recipient, {});
  if (!isValid) throw new ExchangeError(createWrongTronifyParams({ recipient }));

  const transaction: GenericTransaction = {
    family: payer.currency.family,
    recipient,
    amount: new BigNumber(amount),
    useAllAmount: false,
    subAccountId: tokenAccount.id,
  };
  return buildGenericTransactionIntent(payer.currency.family, SEAM_KIND, payer, transaction);
}

/** Every quote failure gets a code the live app can fall back on: no silent fallback (ADR-050). */
function toQuoteError(error: unknown): ExchangeError {
  const name = error instanceof Error ? error.name : undefined;
  const reason = error instanceof Error ? error.message : String(error);
  switch (name) {
    case "EnergyRentUnsupportedIntent":
      return new ExchangeError(createTronifyUnsupportedTransfer(reason));
    case "EnergyRentProviderNotConfigured":
      return new ExchangeError(createTronifyUnavailable());
    default:
      return new ExchangeError(createTronifyQuoteFailed(reason));
  }
}

function toWireFeeAsset({ unit, ...asset }: SponsoredFeeAsset): GetTronifyQuoteResult["feeAsset"] {
  return {
    type: asset.type,
    ...("assetReference" in asset && asset.assetReference
      ? { assetReference: asset.assetReference }
      : {}),
    unit: { name: unit.name, code: unit.code, magnitude: unit.magnitude },
  };
}

/**
 * `custom.exchange.tronify.getQuote`: the Tronify rent for a TRC-20 transfer, next to the TRX burn
 * it replaces. No order is created.
 */
export async function getTronifyQuote(
  params: GetTronifyQuoteParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<GetTronifyQuoteResult> {
  if (!isTransferParams(params)) throw new ExchangeError(createWrongTronifyParams(params));
  assertTronifyEnabled(getFeature);

  const sender = resolveTronSender(params.fromAccountId, accounts);
  const seam = await loadTronifySeam(sender.payer);
  const intent = await buildTransferIntent(sender, params);

  const quote = await seam.estimateSponsoredFeeQuote(intent).catch(error => {
    throw toQuoteError(error);
  });
  return {
    feeAsset: toWireFeeAsset(quote.feeAsset),
    value: quote.value.toString(),
    originalValue: quote.originalValue.toString(),
  };
}

/**
 * `custom.exchange.tronify.isEnergyDelivered`: one on-chain read of the payer's available energy
 * against `energyNeeded`. It answers "has the energy arrived", not "will the swap validate".
 */
export async function isTronifyEnergyDelivered(
  params: IsTronifyEnergyDeliveredParams | undefined,
  { accounts, getFeature }: TronifyDeps,
): Promise<IsTronifyEnergyDeliveredResult> {
  if (
    !params ||
    typeof params.fromAccountId !== "string" ||
    typeof params.energyNeeded !== "string" ||
    !POSITIVE_INTEGER.test(params.energyNeeded)
  ) {
    throw new ExchangeError(createWrongTronifyParams(params));
  }
  assertTronifyEnabled(getFeature);

  const { payer } = resolveTronSender(params.fromAccountId, accounts);
  const seam = await loadTronifySeam(payer);

  const delivered = await seam.isEnergyDelivered({
    receiverAddress: payer.freshAddress,
    energyNeeded: BigInt(params.energyNeeded),
  });
  return { delivered };
}

export const tronifyHandlers = (deps: TronifyDeps) =>
  ({
    [TRONIFY_GET_QUOTE_METHOD]: customWrapper<GetTronifyQuoteParams, GetTronifyQuoteResult>(
      params => getTronifyQuote(params, deps),
    ),
    [TRONIFY_IS_ENERGY_DELIVERED_METHOD]: customWrapper<
      IsTronifyEnergyDeliveredParams,
      IsTronifyEnergyDeliveredResult
    >(params => isTronifyEnergyDelivered(params, deps)),
  }) as const;
