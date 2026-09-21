import { useNavigation, useRoute } from "@react-navigation/native";
import { mockContactAddress, mockMeContact } from "@domain/entity-contact/schema.mock";
import { act, renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useContactsLedgerSyncStatus } from "../../hooks/useContactsLedgerSyncStatus";
import { useContactDetailScreenViewModel } from "./useContactDetailScreenViewModel";

const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockRegisterExternalAddress = jest.fn(() => new Promise(() => {}));

jest.mock("@features/platform-contacts/device", () => ({
  useContactsIntentsOrchestrator: () => ({
    deviceIntents: { registerExternalAddress: mockRegisterExternalAddress },
    dieProps: undefined,
  }),
}));

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

jest.mock("../../hooks/useContactsLedgerSyncStatus");

jest.mock("../../analytics/useContactsAnalytics", () => ({
  useContactsAnalytics: () => ({
    trackEvent: jest.fn(),
    trackPage: jest.fn(),
    getGlobalProperties: jest.fn(),
  }),
}));

const mockedUseRoute = jest.mocked(useRoute);
const mockedUseNavigation = jest.mocked(useNavigation);
const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

describe("useContactDetailScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
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

  it("should close the add address flow when the device registration starts", async () => {
    const contact = mockMeContact();
    mockedUseRoute.mockReturnValue({
      key: ScreenName.MyWalletContactDetail,
      name: ScreenName.MyWalletContactDetail,
      params: { contactId: contact.id },
    });
    mockedUseNavigation.mockReturnValue({
      navigate: jest.fn(),
      goBack: mockGoBack,
      replace: mockReplace,
      canGoBack: jest.fn(() => true),
    } as never);

    const { result } = renderHook(() => useContactDetailScreenViewModel(), {
      overrideInitialState: withFlagOverrides(
        {
          lwmContacts: {
            enabled: true,
            params: { newBadge: false, eligibleAddressFamilies: ["evm"] },
          },
        },
        state => ({ ...state, contacts: { contacts: [contact] } }),
      ),
    });

    const viewModel = () => {
      if (result.current.status !== "ready") throw new Error("view model is not ready");
      return result.current;
    };

    act(() => viewModel().pageProps.onAddAddress());
    act(() =>
      viewModel().addAddressFlowProps.onCurrencySelected({
        currencyId: mockContactAddress().currencyId,
        assetDisplayName: "Ethereum",
      }),
    );
    act(() =>
      viewModel().addAddressFlowProps.onAddressChange(
        "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        "manual",
      ),
    );
    await waitFor(() => {
      expect(viewModel().addAddressFlowState).toMatchObject({
        status: "enteringAddress",
        addressEntry: { status: "valid" },
      });
    });

    act(() => viewModel().addAddressFlowProps.onAddressConfirm());
    act(() => viewModel().addAddressFlowProps.onContinueFromName());

    expect(mockRegisterExternalAddress).toHaveBeenCalledTimes(1);
    expect(viewModel().addAddressFlowState.status).toBe("closed");
  });
});
