import type { Account, AccountLike } from "@ledgerhq/types-live";
import { createAccountNotFound, ServerError } from "@ledgerhq/wallet-api-core";
import {
  TRONIFY_IS_ENERGY_DELIVERED_METHOD,
  type IsTronifyEnergyDeliveredParams,
  type IsTronifyEnergyDeliveredResult,
} from "@ledgerhq/wallet-api-exchange-module";
import { customWrapper } from "@ledgerhq/wallet-api-server";
import { getSponsoredCoinApi } from "../../bridge/generic-coin-framework/sponsored";
import { getAccountIdFromWalletAccountId } from "../converters";
import type { GetFeatureFn } from "../FeatureFlags/resolver";
import {
  createAccounIdNotFound,
  createTronifyDisabled,
  createTronifyUnavailable,
  createTronifyUnsupportedAccount,
  createWrongTronifyParams,
  ExchangeError,
} from "./error";

type TronifyDeps = {
  accounts: AccountLike[];
  getFeature?: GetFeatureFn;
};

const POSITIVE_INTEGER = /^[1-9]\d*$/;

/** The TRON account that holds the energy, resolved from the TRC-20 token account that sends. */
function resolveTronPayer(fromAccountId: string, accounts: AccountLike[]): Account {
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
  return parent;
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
  if (getFeature?.("gasSponsorship")?.enabled !== true) {
    throw new ExchangeError(createTronifyDisabled());
  }

  const payer = resolveTronPayer(params.fromAccountId, accounts);

  const seam = await getSponsoredCoinApi(payer.currency.id, "local");
  if (!seam) throw new ExchangeError(createTronifyUnavailable());

  const delivered = await seam.isEnergyDelivered({
    receiverAddress: payer.freshAddress,
    energyNeeded: BigInt(params.energyNeeded),
  });
  return { delivered };
}

export const tronifyHandlers = (deps: TronifyDeps) =>
  ({
    [TRONIFY_IS_ENERGY_DELIVERED_METHOD]: customWrapper<
      IsTronifyEnergyDeliveredParams,
      IsTronifyEnergyDeliveredResult
    >(params => isTronifyEnergyDelivered(params, deps)),
  }) as const;
