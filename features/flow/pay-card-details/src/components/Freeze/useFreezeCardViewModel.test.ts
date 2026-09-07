import { renderHook } from "@testing-library/react";
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

function setupMocks({
  status = "ACTIVE" as PayCardStatus["status"] | null,
  isStatusLoading = false,
  isFreezeLoading = false,
  isFreezeError = false,
  isUnfreezeLoading = false,
  isUnfreezeError = false,
} = {}) {
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

  return { freeze, unfreeze };
}

describe("useFreezeCardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isFrozen: false when status is ACTIVE", () => {
    setupMocks({ status: "ACTIVE" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isFrozen).toBe(false);
  });

  it("returns isFrozen: true when status is FROZEN", () => {
    setupMocks({ status: "FROZEN" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isFrozen).toBe(true);
  });

  it("returns isFrozen: true (optimistic) while freeze mutation is loading", () => {
    setupMocks({ status: "ACTIVE", isFreezeLoading: true });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isFrozen).toBe(true);
  });

  it("returns isFrozen: false (optimistic) while unfreeze mutation is loading", () => {
    setupMocks({ status: "FROZEN", isUnfreezeLoading: true });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isFrozen).toBe(false);
  });

  it("returns isBlocked: true when status is BLOCKED", () => {
    setupMocks({ status: "BLOCKED" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isBlocked).toBe(true);
  });

  it("returns isBlocked: false for non-BLOCKED statuses", () => {
    setupMocks({ status: "ACTIVE" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isBlocked).toBe(false);
  });

  it("calls freeze mutation when onFreeze is invoked", () => {
    const { freeze } = setupMocks({ status: "ACTIVE" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    result.current.onFreeze();
    expect(freeze).toHaveBeenCalledTimes(1);
  });

  it("calls unfreeze mutation when onUnfreeze is invoked", () => {
    const { unfreeze } = setupMocks({ status: "FROZEN" });
    const { result } = renderHook(() => useFreezeCardViewModel());
    result.current.onUnfreeze();
    expect(unfreeze).toHaveBeenCalledTimes(1);
  });

  it("exposes isFreezeError: true when freeze mutation errored", () => {
    setupMocks({ isFreezeError: true });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isFreezeError).toBe(true);
  });

  it("exposes isUnfreezeError: true when unfreeze mutation errored", () => {
    setupMocks({ isUnfreezeError: true });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isUnfreezeError).toBe(true);
  });

  it("exposes isStatusLoading: true while card status query is loading", () => {
    setupMocks({ isStatusLoading: true, status: null });
    const { result } = renderHook(() => useFreezeCardViewModel());
    expect(result.current.isStatusLoading).toBe(true);
    expect(result.current.isFrozen).toBe(false);
  });
});
