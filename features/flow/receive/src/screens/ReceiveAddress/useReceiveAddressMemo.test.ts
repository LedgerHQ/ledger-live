import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { toReceiveAddressTracking } from "./receiveAddressTracking";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressMemo } from "./useReceiveAddressMemo";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const XRP_ADDR = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh";
const [withTag] = toReceiveAddressOptions(
  mockAccountReceive({ address: XRP_ADDR, verification: undefined, memo: { type: "tag" } }),
);
const [withoutMemo] = toReceiveAddressOptions(mockAccountReceive());
const [transparent, shielded] = toReceiveAddressOptions(
  mockAccountReceive({
    shielded: {
      address: "u1shieldedaddressexample0000000000000000000000000000",
      memo: { type: "text" },
    },
  }),
);

function setup(overrides: Partial<Parameters<typeof useReceiveAddressMemo>[0]> = {}) {
  const onOpenUrl = jest.fn();
  const open = jest.fn();
  const close = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressMemo({
        selected: withTag,
        isOpen: false,
        copy: useReceiveAddressCopy({ assetTicker: "XRP", networkName: "XRP Ledger" }),
        onOpenUrl,
        open,
        close,
        tracking: toReceiveAddressTracking(),
        ...overrides,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl, open, close };
}

describe("useReceiveAddressMemo", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers the memo card for an address senders can tag, and opens its panel", () => {
    const { result, open } = setup();

    expect(result.current.memoCard?.title).toBe("Need a Tag/Memo?");
    act(() => result.current.memoCard?.onPress());
    expect(open).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "memo tag info", flow: "receive" }),
    );
  });

  it("offers no memo card for an address without memo", () => {
    expect(setup({ selected: withoutMemo }).result.current.memoCard).toBeUndefined();
  });

  it("follows the Zcash address shown: the private one only", () => {
    expect(setup({ selected: transparent }).result.current.memoCard).toBeUndefined();
    expect(setup({ selected: shielded }).result.current.memoCard).toBeDefined();
  });

  it("explains the memo in its panel, with the support article", () => {
    const { result, onOpenUrl, close } = setup({ isOpen: true });

    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Receive - Need Memo" }),
    );
    act(() => result.current.memoPanel?.learnMore?.onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.memoTag);
    act(() => result.current.memoPanel?.onClose());
    expect(close).toHaveBeenCalled();
  });
});
