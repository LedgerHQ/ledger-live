import { baanxAssetLedgerId } from "@domain/entity-card-asset-mapping";
import {
  PayCardInternalWalletsResponseSchema,
  PayCardLinkedWalletsResponseSchema,
  PayCardStatusResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";
import {
  clearCardOnboardingStatusMock,
  mockPayCardInternalWallets,
  mockPayCardLinkedWallets,
  mockPayCardStatus,
  mockPayCardUser,
  readCardOnboardingStatusMock,
  setCardOnboardingStatusMock,
} from "./cardOnboardingStatus.mock";

describe("the onboarding answers", () => {
  afterEach(() => {
    clearCardOnboardingStatusMock();
  });

  it("mocks nothing until something is set, so requests reach the provider", () => {
    expect(readCardOnboardingStatusMock()).toEqual({});
  });

  it("holds one endpoint without pinning the others", () => {
    setCardOnboardingStatusMock("hasCard", true);

    expect(readCardOnboardingStatusMock()).toEqual({ hasCard: true });
  });

  it("keeps a false answer, which is not the same as no answer", () => {
    setCardOnboardingStatusMock("accountVerified", false);

    const { accountVerified } = readCardOnboardingStatusMock();
    expect(accountVerified).toBe(false);
  });

  it("hands an endpoint back by unsetting it", () => {
    setCardOnboardingStatusMock("walletFunded", true);
    setCardOnboardingStatusMock("walletFunded", undefined);

    // Removed, not held as `undefined`: a present key means a mocked endpoint.
    expect(readCardOnboardingStatusMock()).toEqual({});
  });

  it("drops every answer at once", () => {
    setCardOnboardingStatusMock("accountVerified", true);
    setCardOnboardingStatusMock("hasCard", true);

    clearCardOnboardingStatusMock();

    expect(readCardOnboardingStatusMock()).toEqual({});
  });
});

describe("the mocked responses", () => {
  it("answers as the provider is parsed, or the query would reject them", () => {
    expect(PayCardUserResponseSchema.safeParse(mockPayCardUser(true)).success).toBe(true);
    expect(PayCardUserResponseSchema.safeParse(mockPayCardUser(false)).success).toBe(true);
    expect(PayCardStatusResponseSchema.safeParse(mockPayCardStatus()).success).toBe(true);
    expect(
      PayCardInternalWalletsResponseSchema.safeParse(mockPayCardInternalWallets(true)).success,
    ).toBe(true);
    expect(PayCardLinkedWalletsResponseSchema.safeParse(mockPayCardLinkedWallets()).success).toBe(
      true,
    );
  });

  it("verifies the account only when asked to", () => {
    expect(mockPayCardUser(true).verificationState).toBe("VERIFIED");
    expect(mockPayCardUser(false).verificationState).not.toBe("VERIFIED");
  });

  it("describes the same wallets in both answers, because the join keys them by id", () => {
    const internalIds = mockPayCardInternalWallets(true).map(({ id }) => id);
    const linkedIds = mockPayCardLinkedWallets().map(({ id }) => id);

    // Every wallet is linked, so the join drops none of them and shows no unmatched link.
    expect(internalIds).toEqual(linkedIds);
    expect(new Set(internalIds).size).toBe(internalIds.length);
  });

  it("answers with more than one wallet, so a row is read against its neighbours", () => {
    expect(mockPayCardLinkedWallets()).toHaveLength(3);
  });

  it("links them in the order they are answered, which is the order they are charged", () => {
    expect(mockPayCardLinkedWallets().map(({ priority }) => priority)).toEqual([0, 1, 2]);
  });

  it("puts each wallet on a chain the asset catalog covers, so a mocked row prices", () => {
    for (const { currency, network } of mockPayCardLinkedWallets()) {
      expect(baanxAssetLedgerId(currency, network)).toBeDefined();
    }
  });

  it("funds every wallet only when asked to, and empties them all otherwise", () => {
    for (const { balance } of mockPayCardInternalWallets(true)) {
      expect(Number(balance)).toBeGreaterThan(0);
    }

    for (const { balance } of mockPayCardInternalWallets(false)) {
      expect(Number(balance)).toBe(0);
    }
  });
});
