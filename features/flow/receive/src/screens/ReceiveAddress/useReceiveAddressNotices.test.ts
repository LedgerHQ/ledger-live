import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";

const [verifiable] = toReceiveAddressOptions(mockAccountReceive());
const tronConfig = { ...DEFAULT_RECEIVE_FAMILY_CONFIG, notices: ["tronInactiveAccount" as const] };
const [unverifiable] = toReceiveAddressOptions(mockAccountReceive({ verification: undefined }));

function setup(overrides: Partial<Parameters<typeof useReceiveAddressNotices>[0]> = {}) {
  const onOpenUrl = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressNotices({
        familyConfig: tronConfig,
        selected: verifiable,
        copy: useReceiveAddressCopy({ assetTicker: "TRX", networkName: "Tron" }),
        onOpenUrl,
        ...overrides,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl };
}

describe("useReceiveAddressNotices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the family's notices, with their support link", () => {
    const { result, onOpenUrl } = setup();

    expect(result.current).toEqual([
      expect.objectContaining({ id: "tronInactiveAccount", tone: "warning" }),
    ]);
    act(() => result.current[0].learnMore?.onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("tells the device cannot show the address shown", () => {
    const { result } = setup({ selected: unverifiable });

    expect(result.current.map(({ id }) => id)).toEqual([
      "tronInactiveAccount",
      "unverifiableAddress",
    ]);
  });

  it("shows no notice before the address is shown", () => {
    const { result } = setup({ selected: undefined });

    expect(result.current).toEqual([]);
  });

  it("offers no Learn more when the app cannot open links", () => {
    const { result } = setup({ onOpenUrl: undefined });

    expect(result.current[0].learnMore).toBeUndefined();
  });

  it("keeps the same notices across renders", () => {
    const { result, rerender } = setup();
    const notices = result.current;

    rerender();

    expect(result.current).toBe(notices);
  });
});
