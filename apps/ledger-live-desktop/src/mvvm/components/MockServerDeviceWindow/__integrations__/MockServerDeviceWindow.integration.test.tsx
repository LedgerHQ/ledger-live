import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { MockServerDeviceWindow } from "../index";

const mockUseActiveMockServerDeviceId = jest.fn();
const mockGetMockServerSessionToken = jest.fn();

jest.mock("@ledgerhq/live-dmk-desktop", () => ({
  useActiveMockServerDeviceId: () => mockUseActiveMockServerDeviceId(),
  getMockServerSessionToken: () => mockGetMockServerSessionToken(),
  getMockServerTransportUrl: () => "http://mock.server",
}));

jest.mock("@ledgerhq/device-mockserver-react", () => ({
  MockServerDevice: (props: Record<string, unknown>) => (
    <div data-testid="mock-server-device" data-props={JSON.stringify(props)} />
  ),
}));

describe("MockServerDeviceWindow", () => {
  const playwrightRun = process.env.PLAYWRIGHT_RUN;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.PLAYWRIGHT_RUN;
    mockUseActiveMockServerDeviceId.mockReturnValue("device-1");
    mockGetMockServerSessionToken.mockReturnValue("session-token");
  });

  afterAll(() => {
    if (playwrightRun === undefined) delete process.env.PLAYWRIGHT_RUN;
    else process.env.PLAYWRIGHT_RUN = playwrightRun;
  });

  it("floats the screen of the device behind the active session", () => {
    render(<MockServerDeviceWindow />);

    const device = screen.getByTestId("mock-server-device");
    expect(JSON.parse(device.getAttribute("data-props") ?? "{}")).toEqual({
      url: "http://mock.server",
      token: "session-token",
      deviceId: "device-1",
      floating: true,
    });
  });

  it("stays interactive while a modal disables pointer events on the body", () => {
    render(<MockServerDeviceWindow />);

    expect(screen.getByTestId("mock-server-device").parentElement).toHaveClass(
      "pointer-events-auto",
    );
  });

  it("keeps a press from reaching the document listeners modals dismiss on", () => {
    const onDocumentPointerDown = jest.fn();
    document.addEventListener("pointerdown", onDocumentPointerDown);

    render(<MockServerDeviceWindow />);
    fireEvent.pointerDown(screen.getByTestId("mock-server-device"));

    expect(onDocumentPointerDown).not.toHaveBeenCalled();

    document.removeEventListener("pointerdown", onDocumentPointerDown);
  });

  it("gives the window the theme's text colour so its header icon shows", () => {
    render(<MockServerDeviceWindow />);

    expect(screen.getByTestId("mock-server-device").parentElement).toHaveClass("text-base");
  });

  it("renders nothing without an active mock server device", () => {
    mockUseActiveMockServerDeviceId.mockReturnValue(null);

    render(<MockServerDeviceWindow />);

    expect(screen.queryByTestId("mock-server-device")).not.toBeInTheDocument();
  });

  it("renders nothing in an E2E run", () => {
    process.env.PLAYWRIGHT_RUN = "true";

    render(<MockServerDeviceWindow />);

    expect(screen.queryByTestId("mock-server-device")).not.toBeInTheDocument();
  });

  it.each(["", "0", "false"])("still renders when PLAYWRIGHT_RUN is %p", value => {
    process.env.PLAYWRIGHT_RUN = value;

    render(<MockServerDeviceWindow />);

    expect(screen.getByTestId("mock-server-device")).toBeVisible();
  });

  it("renders nothing before the mock server session is seeded", () => {
    mockGetMockServerSessionToken.mockReturnValue(undefined);

    render(<MockServerDeviceWindow />);

    expect(screen.queryByTestId("mock-server-device")).not.toBeInTheDocument();
  });
});
