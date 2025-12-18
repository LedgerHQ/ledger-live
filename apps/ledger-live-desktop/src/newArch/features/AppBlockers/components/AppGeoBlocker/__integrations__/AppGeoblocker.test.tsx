import React from "react";
import { getEnv } from "@ledgerhq/live-env";
import { server, HttpResponse, http } from "tests/server";
import { waitFor, render, screen, cleanup } from "tests/testSetup";
import createStore from "~/renderer/createStore";
import { AppGeoBlocker } from "../index";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));
jest.mock("~/config/urls", () => ({
  urls: { geoBlock: { learnMore: "https://test/learn-more" } },
}));
jest.mock("LLD/features/AppBlockers/components/AppBlocker", () => ({
  AppBlocker: ({ children, blocked }: { children: React.ReactNode; blocked: boolean }) =>
    blocked ? null : children,
}));

const windowApi = {
  appDirname: "",
  appLoaded: jest.fn(),
  reloadRenderer: jest.fn(),
  openWindow: jest.fn(),
};

const OFAC_ENDPOINT = `${getEnv("LEDGER_COUNTERVALUES_API")}/v3/markets`;

describe("AppGeoBlocker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.api = windowApi;
  });

  afterEach(() => {
    cleanup();
  });

  it("calls window.api.appLoaded on finish if window.api exists", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.json({}, { status: 200 })));
    const store = createStore({});
    render(
      <AppGeoBlocker>
        <div>child</div>
      </AppGeoBlocker>,
      { store },
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());
  });

  it("renders children when not blocked", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.json({}, { status: 200 })));
    const store = createStore({});
    render(
      <AppGeoBlocker>
        <div data-testid="child">Visible</div>
      </AppGeoBlocker>,
      { store },
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders geoblocking UI when blocked", async () => {
    server.use(
      http.get("*/v3/markets", () => {
        return HttpResponse.json({}, { status: 451 });
      }),
    );
    const store = createStore({});
    render(
      <AppGeoBlocker>
        <div data-testid="child">Should not be visible</div>
      </AppGeoBlocker>,
      { store },
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders children when API fails (graceful fallback)", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.error()));
    const store = createStore({});
    render(
      <AppGeoBlocker>
        <div data-testid="child">Visible despite error</div>
      </AppGeoBlocker>,
      { store },
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("does not throw if window.api is undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    window.api = undefined as never;

    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.json({}, { status: 200 })));
    const store = createStore({});
    expect(() =>
      render(
        <AppGeoBlocker>
          <div>child</div>
        </AppGeoBlocker>,
        { store },
      ),
    ).not.toThrow();
  });

  it("renders nothing if children is null and not blocked", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.json({}, { status: 200 })));
    const store = createStore({});
    const { container } = render(<AppGeoBlocker>{null}</AppGeoBlocker>, { store });
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(container).toBeEmptyDOMElement();
  });

  it("renders custom children when not blocked", async () => {
    server.use(http.get(OFAC_ENDPOINT, () => HttpResponse.json({}, { status: 200 })));
    const store = createStore({});
    render(
      <AppGeoBlocker>
        <span>Custom Content</span>
      </AppGeoBlocker>,
      { store },
    );
    await waitFor(() => expect(windowApi.appLoaded).toHaveBeenCalled());

    expect(screen.getByText("Custom Content")).toBeInTheDocument();
  });
});
