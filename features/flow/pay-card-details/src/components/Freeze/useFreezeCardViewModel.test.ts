import { act, renderHook } from "@testing-library/react";
import { useFreezeCardViewModel } from "./useFreezeCardViewModel";

jest.mock("@domain/api-card-management", () => ({
  useFreezeCardMutation: jest.fn(),
  useGetCardStatusQuery: jest.fn(),
  useUnfreezeCardMutation: jest.fn(),
}));

import {
  useFreezeCardMutation,
  useGetCardStatusQuery,
  useUnfreezeCardMutation,
  type PayCardStatus,
} from "@domain/api-card-management";

type Setup = {
  status?: PayCardStatus["status"] | null;
  isStatusLoading?: boolean;
  isFreezeLoading?: boolean;
  isUnfreezeLoading?: boolean;
};

function renderWith({
  status = "ACTIVE",
  isStatusLoading = false,
  isFreezeLoading = false,
  isUnfreezeLoading = false,
}: Setup = {}) {
  const freeze = jest.fn();
  const unfreeze = jest.fn();

  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    data: status
      ? { id: "card-id", panLast4: "1234", status, type: "VIRTUAL" as const, orderedAt: "" }
      : undefined,
    isLoading: isStatusLoading,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);

  jest
    .mocked(useFreezeCardMutation)
    .mockReturnValue([freeze, { isLoading: isFreezeLoading }] as unknown as ReturnType<
      typeof useFreezeCardMutation
    >);

  jest
    .mocked(useUnfreezeCardMutation)
    .mockReturnValue([unfreeze, { isLoading: isUnfreezeLoading }] as unknown as ReturnType<
      typeof useUnfreezeCardMutation
    >);

  return { freeze, unfreeze, ...renderHook(() => useFreezeCardViewModel()) };
}

describe("useFreezeCardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads a FROZEN card as frozen", () => {
    expect(renderWith({ status: "FROZEN" }).result.current.isFrozen).toBe(true);
  });

  it.each(["ACTIVE", "BLOCKED"] as const)("does not read a %s card as frozen", status => {
    expect(renderWith({ status }).result.current.isFrozen).toBe(false);
  });

  it.each(["ACTIVE", "FROZEN"] as const)("keeps the action available on a %s card", status => {
    expect(renderWith({ status }).result.current.isActionDisabled).toBe(false);
  });

  it.each([
    ["the card is blocked", { status: "BLOCKED" }],
    ["the card status has not arrived yet", { status: null, isStatusLoading: true }],
    ["a freeze is in flight", { isFreezeLoading: true }],
    ["an unfreeze is in flight", { isUnfreezeLoading: true }],
  ] as const)("makes the action unavailable when %s", (_reason, setup) => {
    expect(renderWith(setup).result.current.isActionDisabled).toBe(true);
  });

  it.each([
    ["freeze", { isFreezeLoading: true }],
    ["unfreeze", { isUnfreezeLoading: true }],
  ] as const)("marks the card as updating while the %s request is in flight", (_request, setup) => {
    expect(renderWith(setup).result.current.isUpdating).toBe(true);
  });

  it("marks an idle card as not updating", () => {
    expect(renderWith().result.current.isUpdating).toBe(false);
  });

  it("keeps the confirmation closed until the tile is pressed", () => {
    expect(renderWith().result.current.isConfirmOpen).toBe(false);
  });

  it("opens the confirmation on request", () => {
    const { result } = renderWith();

    act(() => result.current.onOpenConfirm());

    expect(result.current.isConfirmOpen).toBe(true);
  });

  it("closes the confirmation when it is dismissed", () => {
    const { result } = renderWith();

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onCloseConfirm());

    expect(result.current.isConfirmOpen).toBe(false);
  });

  it("freezes an unfrozen card and closes the confirmation", () => {
    const { freeze, unfreeze, result } = renderWith({ status: "ACTIVE" });

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onConfirm());

    expect(freeze).toHaveBeenCalledTimes(1);
    expect(unfreeze).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(false);
  });

  it("unfreezes a frozen card and closes the confirmation", () => {
    const { freeze, unfreeze, result } = renderWith({ status: "FROZEN" });

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onConfirm());

    expect(unfreeze).toHaveBeenCalledTimes(1);
    expect(freeze).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(false);
  });
});
