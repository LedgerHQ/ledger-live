import { readOnlyConfigStorage, type AppConfigStorage } from "@shared/app-config";
import { getAuthProvider } from "@shared/auth";
import { getEnv, setEnv } from "@shared/env";
import { setOverride } from "@shared/feature-flags";
import { importTrustchainStoreState } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { HttpResponse, http, server } from "tests/server";
import { renderHook, waitFor } from "tests/testSetup";
import createStore from "~/state-manager/configureStore";
import { loadAppConfig } from "~/setup/load";
import { useLedgerSyncInfo } from "../hooks/useLedgerSyncInfo";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";

type Option = "prod" | "staging";

const OPTIONS: readonly Option[] = ["prod", "staging"];
const STATUS = { name: "ledger-sync", version: "1.0.0" };
const TRUSTCHAIN: Trustchain = {
  rootId: "ROOTID",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
};
const MEMBER_CREDENTIALS: MemberCredentials = {
  pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
  privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03", // gitleaks:allow
};
const originalMockEnv = getEnv("MOCK");

describe("ledgerKeyRing switch", () => {
  beforeEach(() => {
    setEnv("MOCK", "");
  });

  afterEach(() => {
    setEnv("MOCK", originalMockEnv);
  });

  it.each(OPTIONS)(
    "should send the Keycloak, LKRP and Cloud Sync requests to the %s backends, whatever the Wallet Sync flag says",
    async selected => {
      const requested = recordBackendRequests();
      const store = createStore({
        fetchRemoteFlags: null,
        appConfig: loadAppConfig(selecting(selected), "prod"),
      });
      store.dispatch(
        setOverride({
          key: "lldWalletSync",
          value: {
            enabled: true,
            params: {
              environment: selected === "prod" ? "STAGING" : "PROD",
              watchConfig: {},
              learnMoreLink: "",
            },
          },
        }),
      );

      await requestKeycloakToken(store);
      await requestLkrpChallenge(store);
      const { result } = renderHook(() => useLedgerSyncInfo(), { store });
      await waitFor(() => expect(result.current.statusQuery.isLoading).toBe(false));

      expect(
        new Set(requested.mock.calls.map(([option, backend]) => `${option}:${backend}`)),
      ).toEqual(
        new Set([
          `${selected}:keycloak`,
          `${selected}:lkrpSdk`,
          `${selected}:lkrpStatus`,
          `${selected}:cloudSync`,
        ]),
      );
    },
  );
});

/** Stubs the backends of every option, and records which ones are requested. */
function recordBackendRequests() {
  const requested = jest.fn();
  server.use(
    ...OPTIONS.flatMap(option => {
      const { keycloakBaseUrl, trustchainApiBaseUrl, cloudSyncApiBaseUrl } = configOf(option);
      return [
        http.get(`${keycloakBaseUrl}/realms/:realm/protocol/openid-connect/auth`, () => {
          requested(option, "keycloak");
          return HttpResponse.json({ message: "unavailable" }, { status: 503 });
        }),
        http.get(`${trustchainApiBaseUrl}/v1/challenge`, () => {
          requested(option, "lkrpSdk");
          return HttpResponse.json({ message: "unavailable" }, { status: 503 });
        }),
        http.get(`${trustchainApiBaseUrl}/_info`, () => {
          requested(option, "lkrpStatus");
          return HttpResponse.json(STATUS);
        }),
        http.get(`${cloudSyncApiBaseUrl}/_info`, () => {
          requested(option, "cloudSync");
          return HttpResponse.json(STATUS);
        }),
      ];
    }),
  );
  return requested;
}

/** With Ledger auth on and a trustchain, a token request reaches Keycloak first. */
async function requestKeycloakToken(store: ReturnType<typeof createStore>) {
  store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
  store.dispatch(
    importTrustchainStoreState({ trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS }),
  );
  await expect(
    getAuthProvider(store.dispatch).withToken({ queryFn: () => Promise.resolve() }),
  ).rejects.toBeDefined();
}

/** The LKRP SDK of the Ledger Sync middleware starts an authentication with the challenge. */
async function requestLkrpChallenge(store: ReturnType<typeof createStore>) {
  const { result } = renderHook(() => useTrustchainSdk(), { store });
  await expect(
    result.current.withAuth(TRUSTCHAIN, MEMBER_CREDENTIALS, () => Promise.resolve(), "no-cache"),
  ).rejects.toBeDefined();
}

function configOf(option: Option) {
  return loadAppConfig(selecting(option), "prod").config;
}

function selecting(ledgerKeyRing: Option): AppConfigStorage {
  return {
    selections: readOnlyConfigStorage(() => ({ ledgerKeyRing })),
    devValues: readOnlyConfigStorage(() => ({})),
  };
}
