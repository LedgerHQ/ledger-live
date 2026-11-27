import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { track } from "@shared/analytics";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import { LedgerSyncMembersUnresolvedError } from "@features/platform-ledger-sync";
import { renderHook, waitFor } from "@tests/test-renderer";
import { useLifeCycle } from "../useLifeCycle";

const mockNavigationDispatch = jest.fn();
const mockInvalidateAuth = jest.fn();
const mockRestore = jest.fn();
const mockResetKeyRingState = jest.fn();
const mockedTrack = jest.mocked(track);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ dispatch: mockNavigationDispatch }),
  StackActions: { replace: jest.fn((...args: unknown[]) => ({ type: "REPLACE", ...args })) },
}));

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  resetKeyRingState: () => {
    mockResetKeyRingState();
    return { type: "test/resetKeyRingState" };
  },
}));

jest.mock("../useKeyRingClient", () => ({
  useKeyRingClient: () => ({ invalidateAuth: mockInvalidateAuth, restore: mockRestore }),
}));

function QueryClientWrapper({ children }: { children?: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());
  return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function renderLifeCycle() {
  return renderHook(() => useLifeCycle(), {
    innerWrapper: QueryClientWrapper,
    overrideInitialState: state => ({ ...state, trustchain: mockKeyRingState() }),
  });
}

// The v1 SDK errors reach the app unchanged: only their name identifies them.
function keyRingSdkError(name: string): Error {
  const error = new Error();
  error.name = name;
  return error;
}

describe("useLifeCycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRestore.mockReturnValue(new Promise(() => {}));
  });

  it("should expose handleError function", () => {
    const { result } = renderLifeCycle();
    expect(result.current.handleError).toBeInstanceOf(Function);
  });

  it("should reset on TrustchainEjected", () => {
    const { result } = renderLifeCycle();
    result.current.handleError(keyRingSdkError("TrustchainEjected"));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should reset on TrustchainNotAllowed", () => {
    const { result } = renderLifeCycle();
    result.current.handleError(keyRingSdkError("TrustchainNotAllowed"));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should call restoreTrustchain on TrustchainOutdated", async () => {
    const { result } = renderLifeCycle();
    result.current.handleError(keyRingSdkError("TrustchainOutdated"));

    await waitFor(() => expect(mockRestore).toHaveBeenCalled());
    expect(mockResetKeyRingState).not.toHaveBeenCalled();
  });

  it("should reset when the backend lost the key tree of this instance", () => {
    const { result } = renderLifeCycle();
    result.current.handleError(
      Object.assign(new Error("No such trustchain"), { name: "LedgerAPI4xx" }),
    );

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockNavigationDispatch).toHaveBeenCalled();
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should reset when the members query resolved no members", () => {
    const { result } = renderLifeCycle();
    result.current.handleError(new LedgerSyncMembersUnresolvedError(["useGetMembers", null]));

    expect(mockResetKeyRingState).toHaveBeenCalled();
    expect(mockedTrack).toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockInvalidateAuth).toHaveBeenCalled();
  });

  it("should not reset for unknown errors", () => {
    const { result } = renderLifeCycle();
    result.current.handleError(new Error("some random error"));

    expect(mockResetKeyRingState).not.toHaveBeenCalled();
    expect(mockedTrack).not.toHaveBeenCalledWith("ledgersync_deactivated");
    expect(mockRestore).not.toHaveBeenCalled();
  });
});
