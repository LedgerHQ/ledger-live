import { fireEvent, render, screen } from "@support/jest-devtools/native";
import { Share } from "react-native";
import { buildProps } from "jest/deviceOnboardingProps";
import { emptyLogCopy, openNextScreenCopy } from "./configCopy";
import DeviceOnboarding from "./DeviceOnboarding";

const connectedDevice = {
  name: "Ledger Flex",
  modelId: "europa",
  sessionId: "session-1",
  wired: false,
};

describe("DeviceOnboarding", () => {
  it("asks you to pair a device before the log starts", () => {
    render(<DeviceOnboarding {...buildProps()} />);

    expect(screen.getByText(emptyLogCopy.title)).toBeTruthy();
    expect(screen.getByText(emptyLogCopy.description)).toBeTruthy();
    expect(screen.queryByText("No event accepted in this state")).toBeNull();
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
    expect(screen.queryByText("Possible")).toBeNull();
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

    fireEvent.press(screen.getByText("Connect"));
    fireEvent.press(screen.getByText("Reset"));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("keeps each switch on the config tab, with a short line under its name", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          sendableEvents: [{ event: { type: "CONTINUE" } }],
        })}
      />,
    );

    expect(screen.getByText("CONTINUE")).toBeTruthy();
    expect(screen.queryByText(openNextScreenCopy.title)).toBeNull();
    fireEvent.press(screen.getByText("Config"));
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
          events: [
            { id: "first", type: "STEP_CHANGED", at: 0, detail: { kind: "step", step: "pin" } },
            { id: "quit", type: "QUIT", at: 1 },
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
    fireEvent.press(screen.getByText("Context"));
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
          events: [
            {
              id: "read",
              type: "DEVICE_STATE_READ",
              at: 1,
              payload: { firmwareVersion: "1.7.0", state: { seedWordIndex: 2 } },
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
          events: [
            { id: "first", type: "SESSION_READY", at: 1 },
            { id: "second", type: "FIRMWARE_CHECK_FAILED", at: 2 },
          ],
        })}
      />,
    );

    fireEvent.press(screen.getByText("Export logs"));

    const message = share.mock.calls[0][0].message;
    expect(JSON.parse(message ?? "")).toMatchObject({
      state: "readingState",
      events: [{ id: "first" }, { id: "second" }],
    });
  });

  it("surfaces a host error", () => {
    render(<DeviceOnboarding {...buildProps({ error: "Bluetooth is off" })} />);

    expect(screen.getByText("Bluetooth is off")).toBeTruthy();
  });
});
