import { act, renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useAddAddressFlowViewModel } from "./useAddAddressFlowViewModel";

const ETHEREUM_CURRENCY_ID = getCryptoCurrencyById("ethereum").id;

describe("useAddAddressFlowViewModel", () => {
  it("should be closed initially", () => {
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should start currency selection for Me", () => {
    const contactId = mockMeContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactId));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: contactId,
    });
  });

  it("should replace the selected contact when restarted", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(firstContactId));
    act(() => result.current.start(nextContactId));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
    });
  });

  it("should continue to address entry with the selected contact and currency", () => {
    const contactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactId));
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_CURRENCY_ID));

    expect(result.current.state).toEqual({
      status: "enteringAddress",
      selectedContactId: contactId,
      selectedCurrencyId: ETHEREUM_CURRENCY_ID,
    });
  });

  it("should ignore a currency selected for a stale contact session", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(firstContactId));
    act(() => result.current.start(nextContactId));
    act(() => result.current.completeCurrencySelection(firstContactId, ETHEREUM_CURRENCY_ID));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
    });
  });

  it("should clear a previously selected currency when restarted", () => {
    const firstContactId = mockMeContact().id;
    const nextContactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(firstContactId));
    act(() => result.current.completeCurrencySelection(firstContactId, ETHEREUM_CURRENCY_ID));
    act(() => result.current.start(nextContactId));

    expect(result.current.state).toEqual({
      status: "selectingCurrency",
      selectedContactId: nextContactId,
    });
  });

  it("should ignore currency completion after the flow is closed", () => {
    const contactId = mockContact().id;
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(contactId));
    act(() => result.current.close());
    act(() => result.current.completeCurrencySelection(contactId, ETHEREUM_CURRENCY_ID));

    expect(result.current.state).toEqual({ status: "closed" });
  });

  it("should remain closed when closed repeatedly", () => {
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(mockContact().id));
    act(() => result.current.close());
    act(() => result.current.close());

    expect(result.current.state).toEqual({ status: "closed" });
  });
});
