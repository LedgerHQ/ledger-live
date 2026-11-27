import { renderHook } from "@testing-library/react";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import { makeReceiveTestStore, receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const usdt = mockTokenCurrency();
const USDT = CryptoOrTokenCurrencyIdSchema.parse(usdt.id);

describe("useReceiveAddressHeader", () => {
  it("should name the coin and its network when receiving the native coin", () => {
    const { result } = renderHook(() => useReceiveAddressHeader(ETH), {
      wrapper: receiveTestWrapper(),
    });

    expect(result.current).toEqual(
      expect.objectContaining({ title: "Receive ETH", networkLabel: "Ethereum network" }),
    );
    expect(result.current.data?.networkIcon).toEqual({ ledgerId: "ethereum", ticker: "ETH" });
  });

  it("should name the token's parent coin as the network", async () => {
    const store = makeReceiveTestStore();
    await store.dispatch(cryptoAssetsApi.util.upsertQueryData("findTokenById", { id: USDT }, usdt));
    const { result } = renderHook(() => useReceiveAddressHeader(USDT), {
      wrapper: receiveTestWrapper(store),
    });

    expect(result.current).toEqual(
      expect.objectContaining({ title: "Receive USDT", networkLabel: "Ethereum network" }),
    );
    expect(result.current.data?.assetIcon).toEqual({
      ledgerId: USDT,
      ticker: "USDT",
      network: "ethereum",
    });
  });
});
