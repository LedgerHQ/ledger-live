import React from "react";
import { setupServer } from "msw/node";
import { getEnv } from "@ledgerhq/live-env";
import { HttpResponse, http } from "tests/server";
import { waitFor, render, screen } from "tests/testSetup";
import { AppGeoBlocker } from "../index";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { geoBlock: { learnMore: "https://test/learn-more" } },
}));
jest.mock("../../AppBlocker", () => ({
  AppBlocker: ({ children, blocked }: { children: React.ReactNode; blocked: boolean }) =>
    blocked ? null : children,
}));

const ofacResponse = jest.fn();
const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
  openWindow: jest.fn(),
};

describe("AppGeoBlocker", () => {
  const server = setupServer(
    http.get(`${getEnv("LEDGER_COUNTERVALUES_API")}/v3/markets`, ofacResponse),
    http.all("*", () => HttpResponse.json({})),
  );
  server.listen();

  beforeEach(() => {
    jest.clearAllMocks();
    window.api = windowApi;
  });

  it("calls window.api.appLoaded on finish if window.api exists", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 200 }));
    render(
      <AppGeoBlocker>
        <div>child</div>
      </AppGeoBlocker>,
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("renders children when not blocked", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 200 }));
    render(
      <AppGeoBlocker>
        <div data-testid="child">Visible</div>
      </AppGeoBlocker>,
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders geoblocking UI when blocked", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 451 }));
    render(
      <AppGeoBlocker>
        <div data-testid="child">Should not be visible</div>
      </AppGeoBlocker>,
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders children when API fails (graceful fallback)", async () => {
    ofacResponse.mockRejectedValueOnce(new Error("Network error"));
    render(
      <AppGeoBlocker>
        <div data-testid="child">Visible despite error</div>
      </AppGeoBlocker>,
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("does not throw if window.api is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    window.api = undefined as never;

    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 200 }));
    expect(() =>
      render(
        <AppGeoBlocker>
          <div>child</div>
        </AppGeoBlocker>,
      ),
    ).not.toThrow();
  });

  it("renders nothing if children is null and not blocked", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 200 }));
    const { container } = render(<AppGeoBlocker>{null}</AppGeoBlocker>);
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(container).toBeEmptyDOMElement();
  });

  it("renders custom children when not blocked", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 200 }));
    render(
      <AppGeoBlocker>
        <span>Custom Content</span>
      </AppGeoBlocker>,
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});
