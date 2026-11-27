import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
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

function setup(selected = withTag) {
  const onOpenUrl = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressMemo({
        selected,
        copy: useReceiveAddressCopy({ assetTicker: "XRP", networkName: "XRP Ledger" }),
        onOpenUrl,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl };
}

describe("useReceiveAddressMemo", () => {
  beforeEach(() => jest.clearAllMocks());

  it("offers the memo card for an address senders can tag, and opens its panel", () => {
    const { result } = setup();

    expect(result.current.memoCard?.title).toBe("Need a Tag/Memo?");
    expect(result.current.memoPanel).toBeUndefined();
    act(() => result.current.memoCard?.onPress());

    expect(result.current.memoPanel?.description).toContain("Tag/Memo");
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "memo tag info", flow: "receive" }),
    );
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Receive - Need Memo" }),
    );
  });

  it("offers no memo card for an address without memo", () => {
    expect(setup(withoutMemo).result.current.memoCard).toBeUndefined();
  });

  it("follows the Zcash address shown: the private one only", () => {
    expect(setup(transparent).result.current.memoCard).toBeUndefined();
    expect(setup(shielded).result.current.memoCard).toBeDefined();
  });

  it("links the panel to the support article, and closes it", () => {
    const { result, onOpenUrl } = setup();
    act(() => result.current.memoCard?.onPress());

    act(() => result.current.memoPanel?.learnMore.onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.memoTag);
    act(() => result.current.memoPanel?.onClose());
    expect(result.current.memoPanel).toBeUndefined();
  });
});
