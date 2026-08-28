import { act, renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { usePayTabContacts } from "../usePayTabContacts";

const mockNavigate = jest.fn();
const mockOpen = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock("../usePayTabNewPayment", () => ({
  usePayTabNewPayment: () => ({ open: mockOpen }),
}));

describe("usePayTabContacts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds i18n labels and wires the Pay tile to the Send flow", () => {
    const { result } = renderHook(() => usePayTabContacts());

    expect(result.current.title).toBeTruthy();
    expect(result.current.payLabel).toBeTruthy();

    act(() => result.current.onPay());
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("opens the full contacts list from the My Wallet stack with a Pay title on see-all", () => {
    const { result } = renderHook(() => usePayTabContacts());

    act(() => result.current.onSeeAll?.());

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.MyWallet, {
      screen: ScreenName.MyWalletContacts,
      params: { title: expect.any(String) },
    });
  });
});
