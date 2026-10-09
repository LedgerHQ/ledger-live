import { fireEvent, render, screen } from "@support/jest-devtools/native";
import { Share } from "react-native";
import { buildProps, sampleMachine } from "jest/deviceOnboardingProps";
import {
  emptyLogCopy,
  featureFlagCopy,
  headerCopy,
  logCopy,
  machineCopy,
  openNextScreenCopy,
  overrideCopy,
} from "./configCopy";
import DeviceOnboarding from "./DeviceOnboarding";

const connectedDevice = {
  name: "Ledger Flex",
  modelId: "europa",
  sessionId: "session-1",
  wired: false,
};

describe("DeviceOnboarding", () => {
  it("shows the whole machine on its own tab, with the current state marked", () => {
    render(
      <DeviceOnboarding
        {...buildProps({ status: "running", state: "checks.checksIdle", machine: sampleMachine })}
      />,
    );

    fireEvent.press(screen.getByText(machineCopy.tab));

    expect(screen.getByText("checksIdle")).toBeSelected();
    expect(screen.getByText("firmwareCheck")).not.toBeSelected();
    expect(screen.getByText(machineCopy.sources.user)).toBeTruthy();
    expect(screen.getByText("RETRY")).toBeTruthy();
  });

  it("asks you to pair a device before the log starts", () => {
    render(<DeviceOnboarding {...buildProps()} />);

    expect(screen.getByText(emptyLogCopy.title)).toBeTruthy();
    expect(screen.getByText(emptyLogCopy.description)).toBeTruthy();
    expect(screen.queryByText(logCopy.noEvent)).toBeNull();
  });

  it("renders the state and one button per offered event", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          device: connectedDevice,
          state: "checks.genuineCheck",
          sendableEvents: [{ event: { type: "CONTINUE" } }, { event: { type: "QUIT" } }],
          nextStates: [{ event: "DEVICE_STATE_READ", state: "routing" }],
        })}
      />,
    );

    expect(screen.getByText("Ledger Flex · europa · BLE · session-1")).toBeTruthy();
    expect(screen.getByText("DEVICE_STATE_READ")).toBeTruthy();
    expect(screen.getByText("routing")).toBeTruthy();
    expect(screen.getByText("checks.genuineCheck")).toBeTruthy();
    expect(screen.getByText("CONTINUE")).toBeTruthy();
    expect(screen.getByText("QUIT")).toBeTruthy();
  });

  it("sends the event whole, payload included, under the host's own label", () => {
    const send = jest.fn();
    const refused = { type: "GENUINE_CHECK_REFUSED", output: new Error("user said no") } as const;
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          device: connectedDevice,
          state: "readingState",
          sendableEvents: [{ event: refused, label: "REFUSED · user" }],
          send,
        })}
      />,
    );

    fireEvent.press(screen.getByText("REFUSED · user"));

    expect(send).toHaveBeenCalledWith(refused);
  });

  it("refuses to send while no flow is running", () => {
    const send = jest.fn();
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "exited",
          state: "readingState",
          sendableEvents: [{ event: { type: "CONTINUE" } }],
          send,
        })}
      />,
    );

    fireEvent.press(screen.getByText("CONTINUE"));

    expect(send).not.toHaveBeenCalled();
  });

  it("connects on demand and resets the run", () => {
    const connect = jest.fn();
    const reset = jest.fn();
    render(<DeviceOnboarding {...buildProps({ status: "exited", connect, reset })} />);

    fireEvent.press(screen.getByText(headerCopy.connect));
    fireEvent.press(screen.getByText(headerCopy.reset));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("toggles a feature flag param and keeps the rest of the flag", () => {
    const setFeatureFlag = jest.fn();
    render(
      <DeviceOnboarding
        {...buildProps({
          featureFlag: { enabled: true, params: { offerLedgerSync: false } },
          setFeatureFlag,
        })}
      />,
    );

    fireEvent.press(screen.getByText(headerCopy.config));
    expect(screen.getByText(featureFlagCopy.title)).toBeTruthy();
    fireEvent.press(screen.getByRole("switch", { name: "params.offerLedgerSync" }));

    expect(setFeatureFlag).toHaveBeenCalledWith({
      enabled: true,
      params: { offerLedgerSync: true },
    });
  });

  it("keeps each switch on the config tab, with a short line under its name", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          state: "readingState",
          sendableEvents: [{ event: { type: "CONTINUE" } }],
        })}
      />,
    );

    expect(screen.getByText("CONTINUE")).toBeTruthy();
    expect(screen.queryByText(openNextScreenCopy.title)).toBeNull();
    expect(screen.queryByText(overrideCopy.title)).toBeNull();
    fireEvent.press(screen.getByText(headerCopy.config));
    expect(screen.getByText(overrideCopy.title)).toBeTruthy();
    expect(screen.getByText(overrideCopy.genuine)).toBeTruthy();
    expect(screen.getByText(overrideCopy.firmware)).toBeTruthy();
    expect(screen.getByText(openNextScreenCopy.title)).toBeTruthy();
    expect(screen.getByText(openNextScreenCopy.description)).toBeTruthy();
    expect(screen.queryByText("CONTINUE")).toBeNull();
  });

  it("shows the whole run: the device, the context, the log and the exit", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "exited",
          device: { name: "Ledger Flex", modelId: "europa", sessionId: "session-1", wired: false },
          state: "exited",
          context: { isOnboarded: true, verdictMatchesSession: false },
          log: [
            {
              state: "exited",
              event: {
                id: "first",
                type: "STEP_CHANGED",
                at: 0,
                detail: { kind: "step", step: "pin" },
              },
            },
            { state: "exited", event: { id: "quit", type: "QUIT", at: 1 } },
          ],
          exit: {
            reason: "offerLedgerSync",
            sessionId: "session-1",
            modelId: "europa",
          },
        })}
      />,
    );

    expect(screen.getByText("Ledger Flex · europa · BLE · session-1")).toBeTruthy();
    expect(screen.queryByText("verdictMatchesSession")).toBeNull();
    fireEvent.press(screen.getByText(logCopy.context));
    expect(screen.getByText("verdictMatchesSession")).toBeTruthy();
    expect(screen.queryByText("sessionId")).toBeNull();
    fireEvent.press(screen.getByText("QUIT"));
    expect(screen.queryByText("offerLedgerSync")).toBeNull();
    expect(screen.getByText("sessionId")).toBeTruthy();
    expect(screen.getByText("pin")).toBeTruthy();
  });

  it("lists the payload when the event line is opened", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          state: "readingState",
          log: [
            {
              state: "readingState",
              event: {
                id: "read",
                type: "DEVICE_STATE_READ",
                at: 1,
                payload: { firmwareVersion: "1.7.0", state: { seedWordIndex: 2 } },
              },
            },
          ],
        })}
      />,
    );

    expect(screen.queryByText("state.seedWordIndex")).toBeNull();
    fireEvent.press(screen.getByText("DEVICE_STATE_READ"));
    expect(screen.getByText("state.seedWordIndex")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("exports every event in the log", () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    render(
      <DeviceOnboarding
        {...buildProps({
          state: "readingState",
          log: [
            { state: "readingState", event: { id: "first", type: "SESSION_READY", at: 1 } },
            {
              state: "readingState",
              event: { id: "second", type: "FIRMWARE_CHECK_FAILED", at: 2 },
            },
          ],
        })}
      />,
    );

    fireEvent.press(screen.getByText(logCopy.export));

    const message = share.mock.calls[0][0].message;
    expect(JSON.parse(message ?? "")).toMatchObject({
      state: "readingState",
      log: [{ event: { id: "first" } }, { event: { id: "second" } }],
    });
  });

  it("surfaces a host error", () => {
    render(<DeviceOnboarding {...buildProps({ error: "Bluetooth is off" })} />);

    expect(screen.getByText("Bluetooth is off")).toBeTruthy();
  });
});
