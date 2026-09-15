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
  rejects?: boolean;
  onResolved?: () => void;
};

function mutationTrigger(rejects: boolean) {
  return jest.fn(() => ({
    unwrap: () => (rejects ? Promise.reject(new Error("nope")) : Promise.resolve(undefined)),
  }));
}

function renderWith({
  status = "ACTIVE",
  isStatusLoading = false,
  rejects = false,
  onResolved,
}: Setup = {}) {
  const freeze = mutationTrigger(rejects);
  const unfreeze = mutationTrigger(rejects);

  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    data: status
      ? { id: "card-id", panLast4: "1234", status, type: "VIRTUAL" as const, orderedAt: "" }
      : undefined,
    isLoading: isStatusLoading,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);

  jest
    .mocked(useFreezeCardMutation)
    .mockReturnValue([freeze] as unknown as ReturnType<typeof useFreezeCardMutation>);

  jest
    .mocked(useUnfreezeCardMutation)
    .mockReturnValue([unfreeze] as unknown as ReturnType<typeof useUnfreezeCardMutation>);

  return { freeze, unfreeze, ...renderHook(() => useFreezeCardViewModel(onResolved)) };
}

describe("useFreezeCardViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["ACTIVE", "FROZEN", "BLOCKED", "INACTIVE"] as const)(
    "exposes the %s card status",
    status => {
      expect(renderWith({ status }).result.current.status).toBe(status);
    },
  );

  it.each(["ACTIVE", "FROZEN"] as const)("keeps the action available on a %s card", status => {
    expect(renderWith({ status }).result.current.isActionDisabled).toBe(false);
  });

  it.each([
    ["the card is blocked", { status: "BLOCKED" }],
    ["the card status has not arrived yet", { status: null, isStatusLoading: true }],
  ] as const)("makes the action unavailable when %s", (_reason, setup) => {
    expect(renderWith(setup).result.current.isActionDisabled).toBe(true);
  });

  it("starts with the confirmation closed", () => {
    expect(renderWith().result.current.confirmState).toBe("closed");
  });

  it("opens the confirmation on request", () => {
    const { result } = renderWith();

    act(() => result.current.onOpenConfirm());

    expect(result.current.confirmState).toBe("prompt");
  });

  it("closes the confirmation when it is dismissed", () => {
    const { result } = renderWith();

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onClose());

    expect(result.current.confirmState).toBe("closed");
  });

  it("freezes an unfrozen card and closes the confirmation", async () => {
    const { freeze, unfreeze, result } = renderWith({ status: "ACTIVE" });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());

    expect(freeze).toHaveBeenCalledTimes(1);
    expect(unfreeze).not.toHaveBeenCalled();
    expect(result.current.confirmState).toBe("closed");
  });

  it("unfreezes a frozen card and closes the confirmation", async () => {
    const { freeze, unfreeze, result } = renderWith({ status: "FROZEN" });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());

    expect(unfreeze).toHaveBeenCalledTimes(1);
    expect(freeze).not.toHaveBeenCalled();
    expect(result.current.confirmState).toBe("closed");
  });

  it("keeps the confirmation open on a failed request so it can report the error", async () => {
    const { result } = renderWith({ rejects: true });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());

    expect(result.current.confirmState).toBe("error");
  });

  it("reports that the confirmation resolved when it is dismissed", () => {
    const onResolved = jest.fn();
    const { result } = renderWith({ onResolved });

    act(() => result.current.onOpenConfirm());
    act(() => result.current.onClose());

    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it("reports that the confirmation resolved once the mutation succeeds", async () => {
    const onResolved = jest.fn();
    const { result } = renderWith({ onResolved });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());

    expect(onResolved).toHaveBeenCalledTimes(1);
  });

  it("does not report resolution while the confirmation stays open on an error", async () => {
    const onResolved = jest.fn();
    const { result } = renderWith({ rejects: true, onResolved });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());

    expect(onResolved).not.toHaveBeenCalled();
  });

  it("retries from the error state", async () => {
    const { freeze, result } = renderWith({ rejects: true });

    act(() => result.current.onOpenConfirm());
    await act(async () => result.current.onConfirm());
    await act(async () => result.current.onConfirm());

    expect(freeze).toHaveBeenCalledTimes(2);
    expect(result.current.confirmState).toBe("error");
  });

  it("locks the tile while the request is in flight", async () => {
    const { result } = renderWith();

    act(() => result.current.onOpenConfirm());

    let confirming: Promise<void>;
    act(() => {
      confirming = result.current.onConfirm() as unknown as Promise<void>;
    });

    expect(result.current.confirmState).toBe("pending");
    expect(result.current.isActionDisabled).toBe(true);

    await act(async () => confirming);
  });
});
