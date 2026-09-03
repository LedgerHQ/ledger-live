import { act, renderHook } from "@testing-library/react";
import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { makeContactsWrapper } from "./__tests__/contactsStoreTestUtils";
import { useDeleteContactFlowViewModel } from "./useDeleteContactFlowViewModel";

describe("useDeleteContactFlowViewModel", () => {
  it("opens, confirms and notifies success for a saved contact", async () => {
    const contact = mockContact();
    const onSuccess = jest.fn();
    const deletionPort = { deleteContact: jest.fn().mockResolvedValue(undefined) };
    const { result } = renderHook(
      () => useDeleteContactFlowViewModel({ contactId: contact.id, deletionPort, onSuccess }),
      { wrapper: makeContactsWrapper([mockMeContact(), contact]) },
    );

    act(() => result.current.openDelete());
    expect(result.current.deleteLifecycle).toEqual({ status: "open", contactId: contact.id });

    await act(async () => result.current.confirmDelete());
    expect(deletionPort.deleteContact).toHaveBeenCalledWith(contact.id);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });
  });

  it("does not open deletion for the Me contact", () => {
    const me = mockMeContact();
    const deletionPort = { deleteContact: jest.fn() };
    const { result } = renderHook(
      () => useDeleteContactFlowViewModel({ contactId: me.id, deletionPort }),
      { wrapper: makeContactsWrapper([me]) },
    );

    act(() => result.current.openDelete());
    expect(result.current.canDelete).toBe(false);
    expect(result.current.deleteLifecycle).toEqual({ status: "idle" });
  });
});
