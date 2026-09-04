import { payCardAssetLedgerId } from "@domain/entity-pay-card-asset";
import type {
  PayCardLinkedWallet,
  PayCardLinkedWalletResponse,
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
  return response.map(wallet => ({
    ...wallet,
    ledgerId: payCardAssetLedgerId(wallet.currency, wallet.network),
  }));
}
