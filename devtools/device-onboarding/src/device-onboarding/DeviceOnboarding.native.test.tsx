import { fireEvent, render, screen } from "@support/jest-devtools/native";
import { buildProps } from "jest/deviceOnboardingProps";
import DeviceOnboarding from "./DeviceOnboarding";

const connectedDevice = {
  name: "Ledger Flex",
  modelId: "europa",
  sessionId: "session-1",
  wired: false,
};

describe("DeviceOnboarding", () => {
  it("renders the state and one button per offered event", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          device: connectedDevice,
          state: "checks.genuineCheck",
          sendableEvents: [{ event: { type: "CONTINUE" } }, { event: { type: "QUIT" } }],
        })}
      />,
    );

    expect(screen.getByText("checks.genuineCheck")).toBeTruthy();
    expect(screen.getByText("CONTINUE")).toBeTruthy();
    expect(screen.getByText("QUIT")).toBeTruthy();
  });

  it("sends the event whole, payload included, under the host's own label", () => {
    const send = jest.fn();
    const refused = { type: "GENUINE_CHECK_REFUSED", failure: new Error("user said no") } as const;
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

  it("offers a connection only when no flow is running", () => {
    const connect = jest.fn();
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          device: { name: "Ledger Flex", modelId: "europa", sessionId: "session-1", wired: false },
          connect,
        })}
      />,
    );

    fireEvent.press(screen.getByText("Connect"));

    expect(connect).not.toHaveBeenCalled();
  });

  it("offers a connection again once the transport went away mid-run", () => {
    const connect = jest.fn();
    render(<DeviceOnboarding {...buildProps({ status: "running", device: null, connect })} />);

    fireEvent.press(screen.getByText("Connect"));

    expect(connect).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText("verdictMatchesSession")).toBeTruthy();
    expect(screen.getByText("offerLedgerSync")).toBeTruthy();
    expect(screen.getByText("pin")).toBeTruthy();
  });

  it("surfaces a host error", () => {
    render(<DeviceOnboarding {...buildProps({ error: "Bluetooth is off" })} />);

    expect(screen.getByText("Bluetooth is off")).toBeTruthy();
  });
});
