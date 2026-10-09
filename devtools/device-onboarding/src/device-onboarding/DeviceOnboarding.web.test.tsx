import { render, screen } from "@support/jest-devtools/web";
import userEvent from "@testing-library/user-event";
import { buildProps } from "jest/deviceOnboardingProps";
import {
  emptyLogCopy,
  featureFlagCopy,
  headerCopy,
  logCopy,
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
  it("asks you to pair a device before the log starts", () => {
    render(<DeviceOnboarding {...buildProps()} />);

    expect(screen.getByText(emptyLogCopy.title)).toBeInTheDocument();
    expect(screen.getByText(emptyLogCopy.description)).toBeInTheDocument();
    expect(screen.queryByText(logCopy.noEvent)).not.toBeInTheDocument();
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

    expect(screen.getByText("Ledger Flex · europa · BLE · session-1")).toBeInTheDocument();
    expect(screen.getByText("DEVICE_STATE_READ")).toBeInTheDocument();
    expect(screen.getByText("routing")).toBeInTheDocument();
    expect(screen.getByText("checks.genuineCheck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "QUIT" })).toBeEnabled();
  });

  it("sends the event whole, payload included, under the host's own label", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: "REFUSED · user" }));

    expect(send).toHaveBeenCalledWith(refused);
  });

  it("refuses to send while no flow is running", () => {
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "exited",
          state: "readingState",
          sendableEvents: [{ event: { type: "CONTINUE" } }],
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeDisabled();
  });

  it("connects on demand and resets the run", async () => {
    const connect = jest.fn();
    const reset = jest.fn();
    render(<DeviceOnboarding {...buildProps({ status: "exited", connect, reset })} />);

    await userEvent.click(screen.getByRole("button", { name: headerCopy.connect }));
    await userEvent.click(screen.getByRole("button", { name: headerCopy.reset }));

    expect(connect).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("toggles a feature flag param and keeps the rest of the flag", async () => {
    const user = userEvent.setup();
    const setFeatureFlag = jest.fn();
    render(
      <DeviceOnboarding
        {...buildProps({
          featureFlag: { enabled: true, params: { offerLedgerSync: false } },
          setFeatureFlag,
        })}
      />,
    );

    await user.click(screen.getByRole("radio", { name: headerCopy.config }));
    expect(screen.getByText(featureFlagCopy.title)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "enabled" })).toBeChecked();
    await user.click(screen.getByRole("switch", { name: "params.offerLedgerSync" }));

    expect(setFeatureFlag).toHaveBeenCalledWith({
      enabled: true,
      params: { offerLedgerSync: true },
    });
  });

  it("keeps each switch on the config tab, with a short line under its name", async () => {
    const user = userEvent.setup();
    render(
      <DeviceOnboarding
        {...buildProps({
          status: "running",
          state: "readingState",
          sendableEvents: [{ event: { type: "CONTINUE" } }],
        })}
      />,
    );

    expect(screen.getByRole("button", { name: "CONTINUE" })).toBeInTheDocument();
    expect(screen.queryByText(openNextScreenCopy.title)).not.toBeInTheDocument();
    expect(screen.queryByText(overrideCopy.title)).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: headerCopy.config }));
    const override = screen.getByText(overrideCopy.title);
    const nextScreen = screen.getByText(openNextScreenCopy.title);
    expect(override.compareDocumentPosition(nextScreen) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText(overrideCopy.genuine)).toBeInTheDocument();
    expect(screen.getByText(overrideCopy.firmware)).toBeInTheDocument();
    expect(screen.getByText(openNextScreenCopy.title)).toBeInTheDocument();
    expect(screen.getByText(openNextScreenCopy.description)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CONTINUE" })).not.toBeInTheDocument();
  });

  it("shows the whole run: the device, the context, the log and the exit", async () => {
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

    expect(screen.getByText("Ledger Flex · europa · BLE · session-1")).toBeInTheDocument();
    expect(screen.queryByText("verdictMatchesSession")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: logCopy.context }));
    expect(screen.getByText("verdictMatchesSession")).toBeInTheDocument();
    expect(screen.queryByText("sessionId")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("QUIT"));
    expect(screen.queryByText("offerLedgerSync")).not.toBeInTheDocument();
    expect(screen.getByText("sessionId")).toBeInTheDocument();
    expect(screen.getByText("pin")).toBeInTheDocument();
  });

  it("lists the payload when the event line is opened", async () => {
    const user = userEvent.setup();
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

    expect(screen.queryByText("state.seedWordIndex")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /DEVICE_STATE_READ/ }));
    expect(screen.getByText("state.seedWordIndex")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("exports every event in the log", async () => {
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
    const link = document.createElement("a");
    const click = jest.spyOn(link, "click").mockImplementation();
    jest.spyOn(document, "createElement").mockReturnValueOnce(link);

    await userEvent.click(screen.getByRole("button", { name: logCopy.export }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(link.download).toBe("device-onboarding-logs.json");
    const content = decodeURIComponent(link.href.split(",")[1]);
    expect(JSON.parse(content)).toMatchObject({
      state: "readingState",
      log: [{ event: { id: "first" } }, { event: { id: "second" } }],
    });
  });

  it("surfaces a host error", () => {
    render(<DeviceOnboarding {...buildProps({ error: "Bluetooth is off" })} />);

    expect(screen.getByText("Bluetooth is off")).toBeInTheDocument();
  });
});
