import { act, renderHook } from "@testing-library/react";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { track, trackPage } from "@shared/analytics";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "../../copy/useReceiveAddressCopy";
import { DEFAULT_RECEIVE_FAMILY_CONFIG } from "../../logic/resolveReceiveFamilyConfig";
import { toReceiveAddressOptions } from "../../logic/toReceiveAddressOptions";
import { RECEIVE_URLS } from "../../urls";
import { useReceiveAddressNotices } from "./useReceiveAddressNotices";

jest.mock("@shared/analytics", () => ({ track: jest.fn(), trackPage: jest.fn() }));

const [verifiable] = toReceiveAddressOptions(mockAccountReceive());
const tronConfig = { ...DEFAULT_RECEIVE_FAMILY_CONFIG, notices: ["tronInactiveAccount" as const] };
const [unverifiable] = toReceiveAddressOptions(mockAccountReceive({ verification: undefined }));

function setup(overrides: Partial<Parameters<typeof useReceiveAddressNotices>[0]> = {}) {
  const onOpenUrl = jest.fn();
  const openServiceStatus = jest.fn();
  const view = renderHook(
    () =>
      useReceiveAddressNotices({
        familyConfig: tronConfig,
        selected: verifiable,
        serviceIncidents: [],
        copy: useReceiveAddressCopy({ assetTicker: "TRX", networkName: "Tron" }),
        onOpenUrl,
        openServiceStatus,
        ...overrides,
      }),
    { wrapper: receiveTestWrapper() },
  );
  return { ...view, onOpenUrl, openServiceStatus };
}

describe("useReceiveAddressNotices", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the family's notices, with their support link", () => {
    const { result, onOpenUrl } = setup();

    expect(result.current.notices).toEqual([
      expect.objectContaining({ id: "tronInactiveAccount", tone: "warning" }),
    ]);
    act(() => result.current.notices[0].learnMore?.onPress());
    expect(onOpenUrl).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("tells the device cannot show the address shown", () => {
    const { result } = setup({ selected: unverifiable });

    expect(result.current.notices.map(({ id }) => id)).toEqual([
      "tronInactiveAccount",
      "unverifiableAddress",
    ]);
  });

  it("shows no notice before the address is shown", () => {
    const { result } = setup({ selected: undefined });

    expect(result.current.notices).toEqual([]);
  });

  it("warns about a service incident, and opens it from its banner", () => {
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

  it("offers no Learn more when the app cannot open links", () => {
    const { result } = setup({ onOpenUrl: undefined });

    expect(result.current.notices[0].learnMore).toBeUndefined();
  });

  it("warns about the first incident only", () => {
    const { result } = setup({
      serviceIncidents: [{ title: "Tron network degraded" }, { title: "Tron explorer down" }],
    });

    expect(result.current.serviceWarning?.title).toBe("Tron network degraded");
  });

  it("sends the warning's page event once, however often the incidents are rebuilt or renamed", () => {
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useReceiveAddressNotices({
          familyConfig: tronConfig,
          selected: verifiable,
          serviceIncidents: [{ title }],
          copy: useReceiveAddressCopy({ assetTicker: "TRX", networkName: "Tron" }),
          onOpenUrl: undefined,
          openServiceStatus: jest.fn(),
        }),
      { wrapper: receiveTestWrapper(), initialProps: { title: "Tron network degraded" } },
    );

    rerender({ title: "Tron network degraded" });
    rerender({ title: "Tron network partially degraded" });

    expect(trackPage).toHaveBeenCalledTimes(1);
  });

  it("warns once the address is shown, not while the user picks one", () => {
    const { result, rerender } = renderHook(
      ({ selected }: { selected: typeof verifiable | undefined }) =>
        useReceiveAddressNotices({
          familyConfig: tronConfig,
          selected,
          serviceIncidents: [{ title: "Tron network degraded" }],
          copy: useReceiveAddressCopy({ assetTicker: "TRX", networkName: "Tron" }),
          onOpenUrl: undefined,
          openServiceStatus: jest.fn(),
        }),
      {
        wrapper: receiveTestWrapper(),
        initialProps: { selected: undefined as typeof verifiable | undefined },
      },
    );

    expect(result.current.serviceWarning).toBeUndefined();
    expect(trackPage).not.toHaveBeenCalled();

    rerender({ selected: verifiable });

    expect(result.current.serviceWarning?.title).toBe("Tron network degraded");
    expect(trackPage).toHaveBeenCalledTimes(1);
  });

  it("keeps the same notices across renders", () => {
    const { result, rerender } = setup();
    const { notices } = result.current;

    rerender();

    expect(result.current.notices).toBe(notices);
  });
});
