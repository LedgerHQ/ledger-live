/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook } from "@testing-library/react-native";
import { useSelector } from "react-redux";
import { useOrderedBleScannedDevices } from "./useOrderedBleScannedDevices";
import type { ScannedDevice } from "@ledgerhq/live-dmk-mobile";

const createMockScannedDevice = (id: string, name?: string): ScannedDevice =>
  ({ deviceId: id, deviceName: name ?? `Device ${id}` }) as unknown as ScannedDevice;

type MockKnownDevice = { id: string };

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  type MockWithTypes = jest.Mock & { withTypes: () => jest.Mock };
  const mockUseDispatch = jest.fn(() => jest.fn()) as MockWithTypes;
  mockUseDispatch.withTypes = () => mockUseDispatch;
  const mockUseSelector = jest.fn() as MockWithTypes;
  mockUseSelector.withTypes = () => mockUseSelector;
  const mockUseStore = jest.fn(() => ({
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  })) as MockWithTypes;
  mockUseStore.withTypes = () => mockUseStore;
  return {
    ...actual,
    useDispatch: mockUseDispatch,
    useSelector: mockUseSelector,
    useStore: mockUseStore,
  };
});

describe("useOrderedBleScannedDevices", () => {
  let mockKnownDevices: MockKnownDevice[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockKnownDevices = [];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);
  });

  it("returns empty list when there are no scanned devices and exposes knownDeviceIds", () => {
    mockKnownDevices = [{ id: "known-1" }, { id: "known-2" }];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);

    const { result } = renderHook(() =>
      useOrderedBleScannedDevices({ devices: [], areKnownDevicesPairable: false }),
    );

    expect(result.current.displayedDevices).toHaveLength(0);
    expect(result.current.knownDeviceIds).toEqual(["known-1", "known-2"]);
  });

  it("orders unknown devices first, then known devices; stable by discovery order within groups", () => {
    // given
    mockKnownDevices = [{ id: "dev-B" }];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);

    const deviceA_v1 = createMockScannedDevice("dev-A");
    const deviceB_v1 = createMockScannedDevice("dev-B");

    // when
    const { result, rerender } = renderHook(
      ({ devices, pairable }: { devices: ScannedDevice[]; pairable?: boolean }) =>
        useOrderedBleScannedDevices({
          devices,
          areKnownDevicesPairable: pairable ?? false,
        }),
      { initialProps: { devices: [deviceB_v1, deviceA_v1], pairable: false } },
    );

    // then
    expect(result.current.displayedDevices.map(d => d.deviceId)).toEqual(["dev-A", "dev-B"]);

    const seqById = Object.fromEntries(
      result.current.displayedDevices.map(d => [d.deviceId, d.discoveryStableOrder]),
    );
    expect(seqById["dev-B"]).toBe(0);
    expect(seqById["dev-A"]).toBe(1);

    // re-render with new object references but same devices
    const deviceA_v2 = createMockScannedDevice("dev-A", "Device dev-A v2");
    const deviceB_v2 = createMockScannedDevice("dev-B", "Device dev-B v2");
    act(() => {
      rerender({ devices: [deviceB_v2, deviceA_v2], pairable: false });
    });

    expect(result.current.displayedDevices.map(d => d.deviceId)).toEqual(["dev-A", "dev-B"]);
    const seqById2 = Object.fromEntries(
      result.current.displayedDevices.map(d => [d.deviceId, d.discoveryStableOrder]),
    );
    expect(seqById2["dev-B"]).toBe(0);
    expect(seqById2["dev-A"]).toBe(1);
  });

  it("does not deprioritize known devices when areKnownDevicesPairable is true", () => {
    // given
    mockKnownDevices = [{ id: "dev-A" }];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);

    const deviceA = createMockScannedDevice("dev-A");
    const deviceB = createMockScannedDevice("dev-B");

    // when
    const { result } = renderHook(() =>
      useOrderedBleScannedDevices({ devices: [deviceA, deviceB], areKnownDevicesPairable: true }),
    );

    // then
    expect(result.current.displayedDevices.map(d => d.deviceId)).toEqual(["dev-A", "dev-B"]);
    expect(result.current.displayedDevices.find(d => d.deviceId === "dev-A")?.isAlreadyKnown).toBe(
      false,
    );
  });

  it("sets grayedOut when devices disappear/reappear", () => {
    // given
    mockKnownDevices = [];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);

    const deviceA_v1 = createMockScannedDevice("dev-A");
    const deviceB_v1 = createMockScannedDevice("dev-B");

    // when
    const { result, rerender } = renderHook(
      ({ devices }: { devices: ScannedDevice[] }) =>
        useOrderedBleScannedDevices({ devices, areKnownDevicesPairable: false }),
      { initialProps: { devices: [deviceA_v1, deviceB_v1] } },
    );

    // then
    expect(result.current.displayedDevices.every(d => d.grayedOut === false)).toBe(true);

    // A remains, B disappears
    const deviceA_v2 = createMockScannedDevice("dev-A", "Device A again");
    act(() => {
      rerender({ devices: [deviceA_v2] });
    });

    const itemA = result.current.displayedDevices.find(d => d.deviceId === "dev-A");
    const itemB = result.current.displayedDevices.find(d => d.deviceId === "dev-B");
    expect(itemA?.grayedOut).toBe(false);
    expect(itemB?.grayedOut).toBe(true);

    // A and B reappear
    const deviceB_v2 = createMockScannedDevice("dev-B", "Device B again");
    act(() => {
      rerender({ devices: [deviceA_v2, deviceB_v2] });
    });

    const itemBAgain = result.current.displayedDevices.find(d => d.deviceId === "dev-B");
    expect(itemBAgain?.grayedOut).toBe(false);
  });

  it("exposes knownDeviceIds from the selector", () => {
    mockKnownDevices = [{ id: "ddd-1" }, { id: "ddd-2" }, { id: "ddd-3" }];
    (useSelector as unknown as jest.Mock).mockImplementation(() => mockKnownDevices);

    const { result } = renderHook(() =>
      useOrderedBleScannedDevices({ devices: [], areKnownDevicesPairable: false }),
    );

    expect(result.current.knownDeviceIds).toEqual(["ddd-1", "ddd-2", "ddd-3"]);
  });
});
