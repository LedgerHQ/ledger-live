import { CARD_WALLET_QUERY_TAGS, cardManagementApi } from "@domain/api-card-management";

type CardWalletCacheAction = ReturnType<typeof cardManagementApi.util.invalidateTags>;

export function invalidateCardWalletQueries(
  dispatch: (action: CardWalletCacheAction) => unknown,
): void {
  dispatch(cardManagementApi.util.invalidateTags([...CARD_WALLET_QUERY_TAGS]));
}
