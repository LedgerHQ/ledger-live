import React, { useContext } from "react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/native";
import { waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { InitialQueriesContext, InitialQueriesProvider } from "../InitialQueriesContext";

const contextSpy = jest.fn();
const ofacResponse = jest.fn();

const SUPPORTED_FIATS_URL = "https://countervalues.live.ledger.com/v3/supported/fiat";

const withCounterValue = (counterValue: string) => (state: State) => ({
  ...state,
  settings: { ...state.settings, counterValue },
});

describe("InitialQueriesContext", () => {
  const server = setupServer(
    http.get("https://countervalues.live.ledger.com/v3/markets", ofacResponse),
    http.all("*", () => HttpResponse.json({})),
  );
  server.listen();

  beforeEach(() => {
    contextSpy.mockClear();
    ofacResponse.mockClear();
  });

  it("provides successful values for firebase and ofacResult", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}));
    renderApp();
    await waitFor(() =>
      expect(contextSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          firebaseIsReady: true,
          ofacResult: { blocked: false, isLoading: false },
        }),
      ),
    );
  });

  it("provides blocked value for ofacResult", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 451 }));
    renderApp();
    await waitFor(() =>
      expect(contextSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          firebaseIsReady: true,
          ofacResult: { blocked: true, isLoading: false },
        }),
      ),
    );
  });

  it("keeps an uncommon persisted counterValue (AMD) once CVS confirms it is supported", async () => {
    // Regression for LIVE-35110: AMD is a valid CVS fiat but absent from the offline
    // fallback list, so it must survive a restart instead of being reset to USD.
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}));
    server.use(http.get(SUPPORTED_FIATS_URL, () => HttpResponse.json(["USD", "EUR", "AMD"])));

    const { store } = render(
      <InitialQueriesProvider>
        <ContextSpy />
      </InitialQueriesProvider>,
      { overrideInitialState: withCounterValue("AMD") },
    );

    await waitFor(() =>
      expect(contextSpy).toHaveBeenLastCalledWith(expect.objectContaining({ fiatsReady: true })),
    );
    expect(store.getState().settings.counterValue).toBe("AMD");
  });

  it("resets counterValue to USD once CVS reports the persisted fiat is unsupported", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}));
    server.use(http.get(SUPPORTED_FIATS_URL, () => HttpResponse.json(["USD", "EUR"])));

    const { store } = render(
      <InitialQueriesProvider>
        <ContextSpy />
      </InitialQueriesProvider>,
      { overrideInitialState: withCounterValue("AMD") },
    );

    await waitFor(() => expect(store.getState().settings.counterValue).toBe("USD"));
  });

  it("reports firebaseIsReady=false while remote flags have not settled", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}));
    render(
      <InitialQueriesProvider>
        <ContextSpy />
      </InitialQueriesProvider>,
      {
        overrideInitialState: state => ({
          ...state,
          featureFlags: { ...state.featureFlags, remoteFlagsReady: false },
        }),
      },
    );
    await waitFor(() =>
      expect(contextSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ firebaseIsReady: false }),
      ),
    );
  });

  afterAll(() => {
    server.close();
  });

  function renderApp() {
    return render(
      <InitialQueriesProvider>
        <ContextSpy />
      </InitialQueriesProvider>,
    );
  }
});

function ContextSpy() {
  const context = useContext(InitialQueriesContext);
  contextSpy(context);
  return null;
}
