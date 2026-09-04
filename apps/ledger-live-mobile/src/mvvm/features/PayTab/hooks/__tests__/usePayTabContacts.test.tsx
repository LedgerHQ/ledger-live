import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { usePayTabContacts } from "../usePayTabContacts";

const mockNavigate = jest.fn();
const mockOpen = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("usePayTabContacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("wires the New tile to open send", () => {
    const { result } = renderHook(() => usePayTabContacts(mockOpen));

    act(() => result.current.onPay());

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the full contacts list from the My Wallet stack with a Pay title on see-all", () => {
    const { result } = renderHook(() => usePayTabContacts(mockOpen));

    act(() => result.current.onSeeAll?.());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContacts,
      params: { title: expect.any(String) },
    });
  });
});
