import { render, screen } from "@support/jest-devtools/web";
import userEvent from "@testing-library/user-event";
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

    expect(screen.getByText("checks.genuineCheck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "QUIT" })).toBeEnabled();
  });

  it("sends the event whole, payload included, under the host's own label", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: "REFUSED · user" }));

    expect(send).toHaveBeenCalledWith(refused);
  });

  it("refuses to send while no flow is running", () => {
    render(
      <DeviceOnboarding
        {...buildProps({ status: "exited", sendableEvents: [{ event: { type: "CONTINUE" } }] })}
      />,
    );

    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeDisabled();
  });

  it("connects on demand and resets the run", async () => {
    const connect = jest.fn();
    const reset = jest.fn();
    render(<DeviceOnboarding {...buildProps({ status: "exited", connect, reset })} />);

    await userEvent.click(screen.getByRole("button", { name: "Connect" }));
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers a connection only when no flow is running", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          state: "readingState",
          device: { name: "Ledger Flex", modelId: "europa", sessionId: "session-1", wired: false },
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("offers a connection again once the transport went away mid-run", () => {
    render(
      <DeviceOnboarding
        {...buildProps({ status: "running", state: "awaitingSession", device: null })}
      />,
    );

    expect(screen.getByRole("button", { name: "Connect" })).toBeEnabled();
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

    expect(screen.getByText("Ledger Flex · europa · BLE · session-1")).toBeInTheDocument();
    expect(screen.getByText("verdictMatchesSession")).toBeInTheDocument();
    expect(screen.getByText("offerLedgerSync")).toBeInTheDocument();
    expect(screen.getByText("pin")).toBeInTheDocument();
  });

  it("surfaces a host error", () => {
    render(<DeviceOnboarding {...buildProps({ error: "Bluetooth is off" })} />);

    expect(screen.getByText("Bluetooth is off")).toBeInTheDocument();
  });
});
