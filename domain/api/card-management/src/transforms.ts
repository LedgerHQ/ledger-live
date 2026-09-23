import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import type {
  PayCardLinkedWallet,
  PayCardLinkedWalletResponse,
  PayCardRewardWallet,
  PayCardRewardWalletResponse,
  PayCardSession,
  PayCardSessionResponse,
} from "./types";

/** Maps a validated token response onto the canonical {@link PayCardSession}. */
export function transformPayCardSessionResponse(response: PayCardSessionResponse): PayCardSession {
  return {
    accessToken: response.access_token,
    expiresIn: response.expires_in,
    refreshToken: response.refresh_token,
  };
}

/**
 * Resolves each card-linked wallet to its Ledger currency.
 *
 * The provider names an asset by a `currency`/`network` pair of its own, so the resolution happens
 * once here rather than in every consumer that needs to price, group or display the wallet.
 */
export function transformPayCardLinkedWallets(
  response: readonly PayCardLinkedWalletResponse[],
): PayCardLinkedWallet[] {
  return response.map(wallet => {
    const ledgerId = baanxAssetLedgerId(wallet.currency, wallet.network);

    // Left off rather than set to `undefined`: `ledgerId` is optional, so an unmapped asset is a
    // wallet without one, not a wallet whose currency is the value `undefined`.
    return ledgerId === undefined ? { ...wallet } : { ...wallet, ledgerId };
  });
}

/**
 * Resolves the reward wallet to its Ledger currency, so it prices like a linked wallet does.
 *
 * The reward names its asset by `currency` alone, while the catalog is keyed on the provider's
 * `currency`/`network` pair, so the pair is completed by repeating the currency: that is the
 * network-less form the catalog already lists. It resolves here, once, rather than in each view.
 */
export function transformPayCardRewardWallet(
  response: PayCardRewardWalletResponse,
): PayCardRewardWallet {
  const ledgerId = baanxAssetLedgerId(response.currency, response.currency);

  return ledgerId === undefined ? { ...response } : { ...response, ledgerId };
}
