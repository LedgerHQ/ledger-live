import { mockMeContact } from "@domain/entity-contact/schema.mock";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useContactsPageViewModel } from "./useContactsPageViewModel";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

function renderViewModel(patchState?: Parameters<typeof withFlagOverrides>[1]) {
  return renderHook(() => useContactsPageViewModel(), {
    overrideInitialState: withFlagOverrides({}, patchState),
  });
}

describe("useContactsPageViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should navigate to the contact detail screen when a contact is opened", () => {
    const me = mockMeContact();
    const { result } = renderViewModel(state => ({
      ...state,
      contacts: { contacts: [me] },
    }));

    act(() => {
      result.current.onOpenContact(me.id);
    });

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.MyWalletContactDetail, {
      contactId: me.id,
    });
  });

  it("should close the feature introduction by going back", () => {
    const { result } = renderViewModel();

    act(() => {
      result.current.featureIntroduction.onClose();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
