import { PayCardStatusResponseSchema, PayCardUserResponseSchema } from "./schema";
import {
  clearCardOnboardingStatusMock,
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
  });

  it("verifies the account only when asked to", () => {
    expect(mockPayCardUser(true).verificationState).toBe("VERIFIED");
    expect(mockPayCardUser(false).verificationState).not.toBe("VERIFIED");
  });
  it.each([true, false])("answers the phone wallet flag when asked to: %s", added => {
    const status = mockPayCardStatus(added);

    expect(status.cardAddedToDigitalWallet).toBe(added);
    expect(PayCardStatusResponseSchema.safeParse(status).success).toBe(true);
  });

  it("leaves the phone wallet flag off when unasked, as a tenant that does not answer for it", () => {
    expect(mockPayCardStatus()).not.toHaveProperty("cardAddedToDigitalWallet");
  });
});
