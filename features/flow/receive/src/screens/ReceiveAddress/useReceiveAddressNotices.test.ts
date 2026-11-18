import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { toReceiveAddressTracking } from "./receiveAddressTracking";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const [verifiable] = toReceiveAddressOptions(mockAccountReceive());
const [unverifiable] = toReceiveAddressOptions(mockAccountReceive({ verification: undefined }));

function setup(overrides: Partial<Parameters<typeof useReceiveAddressNotices>[0]> = {}) {
  const onOpenUrl = jest.fn();
  const openServiceStatus = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressNotices({
        familyConfig: { ...DEFAULT_RECEIVE_FAMILY_CONFIG, notices: ["tronInactiveAccount"] },
        selected: verifiable,
        serviceIncidents: [],
        copy: useReceiveAddressCopy({ assetTicker: "TRX", networkName: "Tron" }),
        onOpenUrl,
        openServiceStatus,
        tracking: toReceiveAddressTracking(),
        ...overrides,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl, openServiceStatus };
}

describe("useReceiveAddressNotices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should show the family's notices, with their support link", () => {
    const { result, onOpenUrl } = setup();

    expect(result.current.notices).toEqual([
      expect.objectContaining({ id: "tronInactiveAccount", tone: "warning" }),
    ]);
    act(() => result.current.notices[0].learnMore?.onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("should tell the device cannot show the address shown", () => {
    const { result } = setup({ selected: unverifiable });

    expect(result.current.notices.map(({ id }) => id)).toEqual([
      "tronInactiveAccount",
      "unverifiableAddress",
    ]);
  });

  it("should show no notice before the address is shown", () => {
    const { result } = setup({ selected: undefined });

    expect(result.current.notices).toEqual([]);
  });

  it("should warn about a service incident, and open it from its banner", () => {
    const { result, openServiceStatus } = setup({
      serviceIncidents: [{ title: "Tron network degraded" }],
    });

    expect(result.current.serviceWarning?.title).toBe("Tron network degraded");
    expect(trackPage).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Receive - Infra Warning" }),
    );
    act(() => result.current.serviceWarning?.onPress());
    expect(openServiceStatus).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "service incident details", flow: "receive" }),
    );
  });
});
