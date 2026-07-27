import { act, renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { useAddAddressFlowViewModel } from "./useAddAddressFlowViewModel";

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

  it("should remain closed when closed repeatedly", () => {
    const { result } = renderHook(() => useAddAddressFlowViewModel());

    act(() => result.current.start(mockContact().id));
    act(() => result.current.close());
    act(() => result.current.close());

    expect(result.current.state).toEqual({ status: "closed" });
  });
});
