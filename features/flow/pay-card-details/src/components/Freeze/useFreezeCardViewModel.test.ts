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
  isFreezeError?: boolean;
  isUnfreezeLoading?: boolean;
  isUnfreezeError?: boolean;
};

function renderWith({
  status = "ACTIVE",
  isStatusLoading = false,
  isFreezeLoading = false,
  isFreezeError = false,
  isUnfreezeLoading = false,
  isUnfreezeError = false,
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
    .mockReturnValue([
      freeze,
      { isLoading: isFreezeLoading, isError: isFreezeError },
    ] as unknown as ReturnType<typeof useFreezeCardMutation>);

  jest
    .mocked(useUnfreezeCardMutation)
    .mockReturnValue([
      unfreeze,
      { isLoading: isUnfreezeLoading, isError: isUnfreezeError },
    ] as unknown as ReturnType<typeof useUnfreezeCardMutation>);

  return { freeze, unfreeze, ...renderHook(() => useFreezeCardViewModel()) };
}

describe("useFreezeCardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["ACTIVE", false],
    ["FROZEN", true],
    ["BLOCKED", false],
  ] as const)("reads a %s card as frozen: %s", (status, isFrozen) => {
    expect(renderWith({ status }).result.current.isFrozen).toBe(isFrozen);
  });

  it("locks the actions only on a BLOCKED card", () => {
    expect(renderWith({ status: "BLOCKED" }).result.current.isBlocked).toBe(true);
    expect(renderWith({ status: "FROZEN" }).result.current.isBlocked).toBe(false);
  });

  it("offers the freeze action while the status is still on its way", () => {
    const { result } = renderWith({ status: null, isStatusLoading: true });

    expect(result.current).toMatchObject({
      isFrozen: false,
      isBlocked: false,
      isStatusLoading: true,
    });
  });

  it("surfaces a freeze that failed", () => {
    expect(renderWith({ isFreezeError: true }).result.current.isFreezeError).toBe(true);
  });

  it("surfaces an unfreeze that failed", () => {
    expect(renderWith({ isUnfreezeError: true }).result.current.isUnfreezeError).toBe(true);
  });

  it("keeps the confirmation closed until the tile is pressed", () => {
    expect(renderWith().result.current.isConfirmOpen).toBe(false);
  });

  it("opens the confirmation from the tile", () => {
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

  it("freezes a card that is not frozen, and closes the confirmation", () => {
    const { freeze, unfreeze, result } = renderWith({ status: "ACTIVE" });

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onConfirm());

    expect(freeze).toHaveBeenCalledTimes(1);
    expect(unfreeze).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(false);
  });

  it("unfreezes a frozen card, and closes the confirmation", () => {
    const { freeze, unfreeze, result } = renderWith({ status: "FROZEN" });

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onConfirm());

    expect(unfreeze).toHaveBeenCalledTimes(1);
    expect(freeze).not.toHaveBeenCalled();
    expect(result.current.isConfirmOpen).toBe(false);
  });
});
