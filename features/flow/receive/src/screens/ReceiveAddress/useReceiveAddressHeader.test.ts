import { renderHook } from "@testing-library/react";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { receiveTestWrapper, testDescriptor } from "../../__tests__/receiveTestStore";
import { useReceiveAddressHeader } from "./useReceiveAddressHeader";

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");

describe("useReceiveAddressHeader", () => {
  it("should name the coin and its network when receiving the native coin", () => {
    const { result } = renderHook(() => useReceiveAddressHeader(testDescriptor, ETH), {
      wrapper: receiveTestWrapper(),
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        title: "Receive ETH",
        networkLabel: "Ethereum network",
        asset: expect.objectContaining({ id: "ethereum", type: "CryptoCurrency" }),
      }),
    );
    expect(result.current.data?.networkIcon).toEqual({ ledgerId: "ethereum", ticker: "ETH" });
  });

  it("should leave the labels empty until the account is known", () => {
    const { result } = renderHook(() => useReceiveAddressHeader(undefined, ETH), {
      wrapper: receiveTestWrapper(),
    });

    expect(result.current).toEqual(
      expect.objectContaining({ title: "", networkLabel: "", data: undefined }),
    );
  });
});
