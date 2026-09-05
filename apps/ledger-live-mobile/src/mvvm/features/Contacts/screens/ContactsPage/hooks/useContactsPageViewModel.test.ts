import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { ScreenName } from "~/const";
import { useContactsLedgerSyncStatus } from "../../../hooks/useContactsLedgerSyncStatus";
import { useContactsPageViewModel } from "./useContactsPageViewModel";

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

jest.mock("../../../hooks/useContactsLedgerSyncStatus");

const mockedContactsLedgerSyncStatus = jest.mocked(useContactsLedgerSyncStatus);

function renderViewModel(patchState?: Parameters<typeof withFlagOverrides>[1]) {
  return renderHook(() => useContactsPageViewModel(), {
    overrideInitialState: withFlagOverrides({}, patchState),
  });
}

function renderViewModelWithFeatureIntroductionDismissed() {
  return renderViewModel(state => ({
    ...state,
    settings: { ...state.settings, hasDismissedContactsFeatureIntroduction: true },
  }));
}

describe("useContactsPageViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedContactsLedgerSyncStatus.mockReturnValue("ready");
  });

  it("should select a contact for Pay instead of opening detail", () => {
    const me = mockMeContact();
    const contact = mockContact({ name: "Rosa" });
    const onSelectContact = jest.fn();
    const { result } = renderHook(() => useContactsPageViewModel(onSelectContact), {
      overrideInitialState: withFlagOverrides({}, state => ({
        ...state,
        contacts: { contacts: [me, contact] },
      })),
    });

    act(() => {
      result.current.onOpenContact(contact.id);
    });

    expect(onSelectContact).toHaveBeenCalledWith(contact);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should hand Me to onSelectContact when the list is selecting", () => {
    const me = mockMeContact();
    const onSelectContact = jest.fn();
    const { result } = renderHook(() => useContactsPageViewModel(onSelectContact), {
      overrideInitialState: withFlagOverrides({}, state => ({
        ...state,
        contacts: { contacts: [me] },
      })),
    });

    act(() => {
      result.current.onOpenContact(me.id);
    });

    expect(onSelectContact).toHaveBeenCalledWith(me);
    expect(mockNavigate).not.toHaveBeenCalled();
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

  it("should keep the Ledger Sync introduction closed while no contact is being added", () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { result } = renderViewModelWithFeatureIntroductionDismissed();

    expect(result.current.ledgerSyncIntroduction.isOpen).toBe(false);
  });

  it("should open the Ledger Sync introduction only when adding a contact is blocked", () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const onAllowed = jest.fn();
    const { result } = renderViewModelWithFeatureIntroductionDismissed();

    act(() => {
      result.current.onRequestAddContact(onAllowed);
    });

    expect(onAllowed).not.toHaveBeenCalled();
    expect(result.current.ledgerSyncIntroduction.isOpen).toBe(true);
  });

  it("should open the activation drawer without leaving Contacts when activating from the introduction", () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { result, store } = renderViewModelWithFeatureIntroductionDismissed();

    act(() => {
      result.current.onRequestAddContact(jest.fn());
    });
    act(() => {
      result.current.ledgerSyncIntroduction.onActivate();
    });

    expect(result.current.ledgerSyncActivationDrawer.isOpen).toBe(true);
    expect(result.current.ledgerSyncIntroduction.isOpen).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.getState().walletSync.returnsToEntryScreen).toBe(true);
  });

  it("should close the activation drawer when it is dismissed", () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { result } = renderViewModelWithFeatureIntroductionDismissed();

    act(() => {
      result.current.ledgerSyncIntroduction.onActivate();
    });
    act(() => {
      result.current.ledgerSyncActivationDrawer.onClose();
    });

    expect(result.current.ledgerSyncActivationDrawer.isOpen).toBe(false);
  });

  it("should close the Ledger Sync introduction when it is dismissed", () => {
    mockedContactsLedgerSyncStatus.mockReturnValue("inactive");
    const { result } = renderViewModelWithFeatureIntroductionDismissed();

    act(() => {
      result.current.onRequestAddContact(jest.fn());
    });
    act(() => {
      result.current.ledgerSyncIntroduction.onDismiss();
    });

    expect(result.current.ledgerSyncIntroduction.isOpen).toBe(false);
    expect(result.current.ledgerSyncActivationDrawer.isOpen).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
