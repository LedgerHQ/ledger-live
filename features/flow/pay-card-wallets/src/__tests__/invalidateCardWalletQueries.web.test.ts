import { CARD_WALLET_QUERY_TAGS, cardManagementApi } from "@domain/api-card-management";
import { invalidateCardWalletQueries } from "../invalidateCardWalletQueries";

describe("invalidateCardWalletQueries", () => {
  it("invalidates the linked wallet list and the balances it is joined with", () => {
    const dispatch = jest.fn();

    invalidateCardWalletQueries(dispatch);

    expect(dispatch).toHaveBeenCalledWith(
      cardManagementApi.util.invalidateTags([...CARD_WALLET_QUERY_TAGS]),
    );
  });
});
