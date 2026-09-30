import { resolveCardTransactionHistoryUiState } from "./cardTransactionHistoryUiState";
import type { CardHistoryDayGroup } from "./groupCardHistoryItems";

const groups: readonly CardHistoryDayGroup[] = [{ day: new Date(2024, 9, 14), items: [] }];

const cardPresent = {
  isCardMissing: false,
  isCardStatusLoading: false,
} as const;

describe("resolveCardTransactionHistoryUiState", () => {
  it("should tell a holder with no session apart from one who has not spent yet", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: false,
        ...cardPresent,
        isLoading: false,
        isError: false,
        groups: [],
      }),
    ).toEqual({ kind: "signedOut" });
  });

  it("should ignore groups while the holder is signed out", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: false,
        isCardMissing: true,
        isCardStatusLoading: true,
        isLoading: true,
        isError: true,
        groups,
      }).kind,
    ).toBe("signedOut");
  });

  it("should use unclaimed when the signed-in holder has no card", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        isCardMissing: true,
        isCardStatusLoading: false,
        isLoading: false,
        isError: true,
        groups: [],
      }),
    ).toEqual({ kind: "unclaimed" });
  });

  it("should stay on loading until the card status settles over a failed transactions read", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        isCardMissing: false,
        isCardStatusLoading: true,
        isLoading: false,
        isError: true,
        groups: [],
      }),
    ).toEqual({ kind: "loading" });
  });

  it("should stay on loading until the signed-in query settles", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        ...cardPresent,
        isLoading: true,
        isError: false,
        groups: [],
      }),
    ).toEqual({ kind: "loading" });
  });

  it("should use error when the signed-in query fails", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        ...cardPresent,
        isLoading: false,
        isError: true,
        groups: [],
      }),
    ).toEqual({ kind: "error" });
  });

  it("should use empty when the signed-in holder has no transactions", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        ...cardPresent,
        isLoading: false,
        isError: false,
        groups: [],
      }),
    ).toEqual({ kind: "empty" });
  });

  it("should carry day groups only on the ready state", () => {
    expect(
      resolveCardTransactionHistoryUiState({
        isSignedIn: true,
        ...cardPresent,
        isLoading: false,
        isError: false,
        groups,
      }),
    ).toEqual({ kind: "ready", groups });
  });
});
