import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { SeedPath, type FirmwareCheck } from "@features/platform-device-onboarding";
import {
  unseededProps,
  type FirmwareUpdateAvailability,
} from "@features/platform-device-onboarding-analytics";
import { track } from "@shared/analytics";
import { renderHook } from "@tests/test-renderer";
import { useUnseededDoneTracking } from "./useUnseededDoneTracking";
import type { UnseededFunnel } from "./useUnseededFunnelTracking";

jest.mock("@shared/analytics", () => ({
  ...jest.requireActual("@shared/analytics"),
  track: jest.fn(),
  getPreviousTrackingPage: jest.fn(() => "Recover new seed"),
}));

function funnel(firmwareUpdateAvailability: FirmwareUpdateAvailability = "no"): UnseededFunnel {
  return {
    props: unseededProps(DeviceModelId.STAX, SeedPath.NewSeed),
    status: { ledgerSyncEligible: true, firmwareUpdateAvailability },
  };
}

type Props = { funnel: UnseededFunnel | null; firmwareKind: FirmwareCheck["kind"] | null };

function render(initialProps: Props, rootId: string | null = null) {
  let props = initialProps;
  const rendered = renderHook(() => useUnseededDoneTracking(props), {
    overrideInitialState: state => ({
      ...state,
      trustchain: {
        ...state.trustchain,
        trustchain: rootId
          ? { rootId, applicationPath: "path", walletSyncEncryptionKey: "key" }
          : null,
      },
    }),
  });
  const rerender = (next: Props) => {
    props = next;
    rendered.rerender(undefined as never);
  };
  return { result: rendered.result, rerender };
}

function doneEvents() {
  return jest.mocked(track).mock.calls.filter(([event]) => event === "onboarding_done");
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useUnseededDoneTracking", () => {
  it("should send onboarding_done once per run, with the unseeded props", () => {
    const { result } = render({ funnel: funnel(), firmwareKind: "upToDate" });

    result.current();
    result.current();

    expect(doneEvents()).toEqual([
      [
        "onboarding_done",
        {
          ...unseededProps(DeviceModelId.STAX, SeedPath.NewSeed),
          source: "Recover new seed",
          ledger_sync_eligibility: "yes",
          ledger_sync_done: "no",
          firmware_update_availability: "no",
          firmware_update_done: "no",
        },
      ],
    ]);
  });

  it("should report Ledger Sync done when the run created a trustchain", () => {
    const { result } = render({ funnel: funnel(), firmwareKind: "upToDate" }, "root");

    result.current();

    expect(doneEvents()[0][1]).toEqual(expect.objectContaining({ ledger_sync_done: "yes" }));
  });

  it("should report the update done after an offered update, even once the check is forgotten", () => {
    const { result, rerender } = render({ funnel: funnel("yes"), firmwareKind: "offered" });
    rerender({ funnel: funnel("yes"), firmwareKind: "upToDate" });
    rerender({ funnel: funnel("yes"), firmwareKind: null });

    result.current();

    expect(doneEvents()[0][1]).toEqual(
      expect.objectContaining({ firmware_update_availability: "yes", firmware_update_done: "yes" }),
    );
  });

  it("should not report the update done when the user declined it", () => {
    const { result } = render({ funnel: funnel("yes"), firmwareKind: "declined" });

    result.current();

    expect(doneEvents()[0][1]).toEqual(expect.objectContaining({ firmware_update_done: "no" }));
  });

  it("should send nothing outside the unseeded funnel", () => {
    const { result } = render({ funnel: null, firmwareKind: null });

    result.current();

    expect(doneEvents()).toEqual([]);
  });
});
