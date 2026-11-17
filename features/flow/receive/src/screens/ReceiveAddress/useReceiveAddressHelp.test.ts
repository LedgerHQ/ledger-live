import { act, renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { toReceiveAddressTracking } from "./receiveAddressTracking";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressHelp } from "./useReceiveAddressHelp";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

function setup(overrides: Partial<Parameters<typeof useReceiveAddressHelp>[0]> = {}) {
  const onOpenUrl = jest.fn();
  const open = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressHelp({
        isOpen: false,
        copy: useReceiveAddressCopy({ assetTicker: "ETH", networkName: "Ethereum" }),
        onOpenUrl,
        open,
        close: jest.fn(),
        tracking: toReceiveAddressTracking(),
        ...overrides,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl, open };
}

describe("useReceiveAddressHelp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens the help from its card", () => {
    const { result, open } = setup();

    expect(result.current.helpCard?.title).toBe("Need support? Get help");
    act(() => result.current.helpCard?.onPress());
    expect(open).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "help", flow: "receive" }),
    );
  });

  it("lists the support questions, each opening its article", () => {
    const { result, onOpenUrl } = setup({ isOpen: true });

    expect(trackPage).toHaveBeenCalledWith(expect.objectContaining({ category: "Receive - Help" }));
    expect(result.current.helpPanel?.questions.map(({ label }) => label)).toEqual([
      "How to receive from exchanges?",
      "How to receive securely?",
    ]);
    act(() => result.current.helpPanel?.questions[1].onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.receiveSecurely);
    expect(track).toHaveBeenCalledWith(
      "faq_clicked",
      expect.objectContaining({ faq: "How to receive securely?" }),
    );
  });

  it("offers no help where the app opens no link", () => {
    const { result } = setup({ onOpenUrl: undefined, isOpen: true });

    expect(result.current).toEqual({ helpCard: undefined, helpPanel: undefined });
  });
});
