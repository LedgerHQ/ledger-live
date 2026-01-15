import React, { useContext } from "react";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/native";
import { waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { InitialQueriesContext, InitialQueriesProvider } from "../InitialQueriesContext";

const contextSpy = jest.fn();
const ofacResponse = jest.fn();

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
      expect(contextSpy).toHaveBeenLastCalledWith({
        firebaseIsReady: true,
        ofacResult: { blocked: false, isLoading: false },
      }),
    );
  });

  it("provides blocked value for ofacResult", async () => {
    ofacResponse.mockResolvedValueOnce(HttpResponse.json({}, { status: 451 }));
    renderApp();
    await waitFor(() =>
      expect(contextSpy).toHaveBeenLastCalledWith({
        firebaseIsReady: true,
        ofacResult: { blocked: true, isLoading: false },
      }),
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
