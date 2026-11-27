import { act, renderHook } from "@testing-library/react";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressHelp } from "./useReceiveAddressHelp";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

function setup() {
  const onOpenUrl = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressHelp({
        copy: useReceiveAddressCopy({ assetTicker: "ETH", networkName: "Ethereum" }),
        onOpenUrl,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl };
}

describe("useReceiveAddressHelp", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens the help from its card", () => {
    const { result } = setup();

    expect(result.current.helpCard.title).toBe("Need support? Get help");
    expect(result.current.helpPanel).toBeUndefined();
    act(() => result.current.helpCard.onPress());

    expect(result.current.helpPanel?.title).toBe("Get help");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "help",
      page: "Receive - Confirmation",
      flow: "receive",
    });
    expect(trackPage).toHaveBeenCalledTimes(1);
    expect(trackPage).toHaveBeenCalledWith({
      category: "Receive - Help",
      props: { page: "Receive - Confirmation", flow: "receive" },
    });
  });

  it("lists the support questions, each opening its article", () => {
    const { result, onOpenUrl } = setup();
    act(() => result.current.helpCard.onPress());

    expect(result.current.helpPanel?.questions.map(({ label }) => label)).toEqual([
      "How to receive from exchanges?",
      "How to receive securely?",
    ]);
    act(() => result.current.helpPanel?.questions[1].onPress());

    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.receiveSecurely);
    expect(track).toHaveBeenCalledWith("faq_clicked", {
      faq: "receiveSecurely",
      page: "Receive - Confirmation",
      flow: "receive",
    });
  });

  it("closes the help", () => {
    const { result } = setup();
    act(() => result.current.helpCard.onPress());
    act(() => result.current.helpPanel?.onClose());

    expect(result.current.helpPanel).toBeUndefined();
  });
});
