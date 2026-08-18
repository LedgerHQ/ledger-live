import { useNavigation, useRoute } from "@react-navigation/native";
import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useContactDetailScreenViewModel } from "./useContactDetailScreenViewModel";

const mockGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock("../../hooks/useContactsAddressValidationAdapter", () => ({
  useContactsAddressValidationAdapter: () => ({
    validateAddress: async ({ address }: { address: string }) => ({
      status: "valid",
      resolvedAddress: address,
      isDomain: false,
    }),
  }),
}));

jest.mock("LLM/features/Send/hooks/useOpenSendFlow", () => ({
  useOpenSendFlow: () => ({ handleOpenSendFlow: jest.fn() }),
}));

jest.mock("../../analytics/useContactsAnalytics", () => ({
  useContactsAnalytics: () => ({
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  }),
}));

const mockedUseRoute = jest.mocked(useRoute);
const mockedUseNavigation = jest.mocked(useNavigation);

describe("useContactDetailScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect when contacts are disabled", () => {
    mockedUseRoute.mockReturnValue({
      key: ScreenName.MyWalletContactDetail,
      name: ScreenName.MyWalletContactDetail,
      params: { contactId: mockMeContact().id },
    });
    mockedUseNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: mockGoBack,
      replace: mockReplace,
      canGoBack: jest.fn(() => true),
    } as never);

    const { result } = renderHook(() => useContactDetailScreenViewModel(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(result.current.status).toBe("redirecting");
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
