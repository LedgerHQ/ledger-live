import React from "react";
import { MemoryRouter } from "react-router";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { I18nProvider } from "@shared/i18n";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import type { CardLoginProps } from "@features/flow-pay-card-auth";
import createStore, { type ReduxStore } from "~/state-manager/configureStore";
import i18n from "~/renderer/i18n/init";
import { render, screen, userEvent, withFlagOverrides } from "tests/testSetup";
import { Card } from "../Card";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@ledgerhq/live-common/wallet-api/useLiveAppManifest", () => ({
  useLiveAppManifest: jest.fn(),
}));

// Stands in for the whole OAuth machine: this test is about the wiring around CardLogin, which is
// covered on its own in the flow package. `useCardAuthStatus` forces the signed-out branch, so the
// login CTA (and not CardDetails) is what mounts.
jest.mock("@features/flow-pay-card-auth", () => ({
  ...jest.requireActual("@features/flow-pay-card-auth"),
  useCardAuthStatus: () => "signedOut",
  CardLogin: ({ openHostedLogin, callback }: CardLoginProps) => (
    <div data-testid="card-login">
      <button onClick={() => openHostedLogin?.("https://provider.test/authorize")}>
        Open login
      </button>
      <span data-testid="card-login-callback-code">{callback?.code ?? "none"}</span>
    </div>
  ),
}));

const mockedManifest = jest.mocked(useLiveAppManifest);

const CATALOG: Record<string, unknown> = {
  "baanx-login-url-stg": {
    id: "baanx-login-url-stg",
    url: "https://dev.api.baanx.test/v1/auth/oauth2/authorize",
  },
  "baanx-hosted-url-stg": { id: "baanx-hosted-url-stg", url: "https://ledger.baanxapi.test" },
};

function manifestsFrom(catalog: Record<string, unknown>) {
  mockedManifest.mockImplementation(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    id => (id ? catalog[id] : undefined) as ReturnType<typeof useLiveAppManifest>,
  );
}

// `render`'s own wrapper option replaces the harness's default providers instead of nesting inside
// them (unlike `renderHook`'s), and the harness's `MemoryRouter` takes a path only, with no way to
// seed router state. This rebuilds just the providers Card actually reaches: the store (real
// reducers, so `useCardAuthStatus`'s own selectors resolve) and i18n, wrapped in a MemoryRouter that
// can carry the deep-link return state.
function renderCard(state: unknown = null) {
  const store: ReduxStore = createStore({
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    state: withFlagOverrides({
      lwdPayTab: { enabled: true, params: { card: true } },
    }) as never,
    fetchRemoteFlags: null,
  });

  return render(<Card />, {
    skipRouter: true,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <I18nProvider i18n={i18n}>
            <MemoryRouter initialEntries={[{ pathname: "/paytab", state }]}>
              {children}
            </MemoryRouter>
          </I18nProvider>
        </I18nextProvider>
      </Provider>
    ),
  });
}

describe("Card (RightPanel) integration", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    manifestsFrom(CATALOG);
  });

  it("navigates to the login manifest's route with the authorize URL to open, on login press", async () => {
    renderCard();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Open login" }));

    // buildHostedPageUrl keeps only the path of the URL CardLogin asked to open, put on the
    // manifest's own base — the authorize page opens on the manifest's origin, not the provider's.
    expect(mockNavigate).toHaveBeenCalledWith("/platform/baanx-login-url-stg?returnTo=%2Fpaytab", {
      state: { goToURL: "https://dev.api.baanx.test/authorize" },
    });
  });

  it("hands the login the code the deep-link return brought on the paytab route", () => {
    renderCard({ code: "auth-code" });

    expect(screen.getByTestId("card-login-callback-code")).toHaveTextContent("auth-code");
  });

  it("hands the login no code when the route carries none", () => {
    renderCard();

    expect(screen.getByTestId("card-login-callback-code")).toHaveTextContent("none");
  });
});
