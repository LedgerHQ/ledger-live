import {
  INITIAL_STATE,
  TRUSTCHAIN_STORE_VERSION,
  importTrustchainStoreState,
  lkrpEnvironmentSelector,
  memberCredentialsSelector,
  resetTrustchainStore,
  setLkrpEnvironment,
  setMemberCredentials,
  setTrustchain,
  trustchainHandlers,
  trustchainSelector,
  trustchainStoreSelector,
} from "../../store";
import type { MemberCredentials, Trustchain } from "../../types";

const MEMBER_CREDENTIALS: MemberCredentials = {
  pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
  privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
};

const TRUSTCHAIN: Trustchain = {
  rootId: "root-id",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
};

const LEGACY_STORE = {
  trustchain: TRUSTCHAIN,
  memberCredentials: MEMBER_CREDENTIALS,
};

const VERSIONED_STORE = {
  ...LEGACY_STORE,
  version: TRUSTCHAIN_STORE_VERSION,
};

describe("trustchain store", () => {
  it("initializes PROD credentials and leaves STAGING absent when importing empty storage", () => {
    const action = importTrustchainStoreState();

    expect(action.payload.PROD).toEqual({
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
    expect(action.payload.STAGING).toBeNull();
  });

  it("preserves valid persisted records", () => {
    const stagingStore = {
      ...VERSIONED_STORE,
      trustchain: { ...TRUSTCHAIN, rootId: "staging-root-id" },
    };
    const action = importTrustchainStoreState({
      PROD: VERSIONED_STORE,
      STAGING: stagingStore,
    });

    expect(action.payload.PROD).toBe(VERSIONED_STORE);
    expect(action.payload.STAGING).toBe(stagingStore);
  });

  it("replaces invalid PROD credentials and leaves invalid STAGING absent", () => {
    const action = importTrustchainStoreState({
      PROD: { ...LEGACY_STORE, memberCredentials: {} as MemberCredentials },
      STAGING: { ...LEGACY_STORE, memberCredentials: null },
    });

    expect(action.payload.PROD).toEqual({
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
    expect(action.payload.STAGING).toBeNull();
  });

  it("migrates an unversioned legacy store when import precedes STAGING selection", () => {
    const imported = trustchainHandlers.TRUSTCHAIN_STORE_IMPORT_STATE(
      INITIAL_STATE,
      importTrustchainStoreState({ PROD: LEGACY_STORE }),
    );
    const migrated = trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
      imported,
      setLkrpEnvironment("STAGING"),
    );

    expect(migrated.PROD).toEqual(VERSIONED_STORE);
    expect(migrated.STAGING).toBe(migrated.PROD);
  });

  it("migrates an unversioned legacy store when STAGING selection precedes import", () => {
    const withEnvironment = trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
      INITIAL_STATE,
      setLkrpEnvironment("STAGING"),
    );
    const migrated = trustchainHandlers.TRUSTCHAIN_STORE_IMPORT_STATE(
      withEnvironment,
      importTrustchainStoreState({ PROD: LEGACY_STORE }),
    );

    expect(migrated.PROD).toEqual(VERSIONED_STORE);
    expect(migrated.STAGING).toBe(migrated.PROD);
  });

  it("initializes a new STAGING store with PROD member credentials", () => {
    const imported = trustchainHandlers.TRUSTCHAIN_STORE_IMPORT_STATE(
      INITIAL_STATE,
      importTrustchainStoreState({ PROD: VERSIONED_STORE }),
    );
    const initialized = trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
      imported,
      setLkrpEnvironment("STAGING"),
    );

    expect(initialized.STAGING).toEqual({
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: MEMBER_CREDENTIALS,
    });
    expect(initialized.PROD).toBe(VERSIONED_STORE);
  });

  it("does not initialize STAGING when PROD is selected", () => {
    const imported = trustchainHandlers.TRUSTCHAIN_STORE_IMPORT_STATE(
      INITIAL_STATE,
      importTrustchainStoreState({ PROD: VERSIONED_STORE }),
    );

    expect(
      trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(imported, setLkrpEnvironment("PROD"))
        .STAGING,
    ).toBeNull();
  });

  it("does not repeat the migration after PROD is versioned", () => {
    const state = {
      environment: "STAGING" as const,
      PROD: VERSIONED_STORE,
      STAGING: null,
    };
    const initialized = trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
      state,
      setLkrpEnvironment("STAGING"),
    );

    expect(initialized.PROD).toBe(VERSIONED_STORE);
    expect(initialized.STAGING?.trustchain).toBeNull();
  });

  it("updates only the active trustchain store", () => {
    const state = {
      environment: "STAGING" as const,
      PROD: VERSIONED_STORE,
      STAGING: {
        version: TRUSTCHAIN_STORE_VERSION,
        trustchain: null,
        memberCredentials: MEMBER_CREDENTIALS,
      },
    };
    const stagingTrustchain = { ...TRUSTCHAIN, rootId: "staging-root-id" };
    const updated = trustchainHandlers.TRUSTCHAIN_STORE_SET_TRUSTCHAIN(
      state,
      setTrustchain(stagingTrustchain),
    );

    expect(updated.PROD).toBe(VERSIONED_STORE);
    expect(updated.STAGING?.trustchain).toBe(stagingTrustchain);
  });

  it("updates only the active member credentials", () => {
    const stagingStore = {
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: MEMBER_CREDENTIALS,
    };
    const state = {
      environment: "STAGING" as const,
      PROD: VERSIONED_STORE,
      STAGING: stagingStore,
    };
    const memberCredentials = { ...MEMBER_CREDENTIALS };
    const updated = trustchainHandlers.TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS(
      state,
      setMemberCredentials(memberCredentials),
    );

    expect(updated.PROD).toBe(VERSIONED_STORE);
    expect(updated.STAGING?.memberCredentials).toBe(memberCredentials);
  });

  it("resets only the active store while preserving its version", () => {
    const state = {
      environment: "STAGING" as const,
      PROD: VERSIONED_STORE,
      STAGING: VERSIONED_STORE,
    };
    const reset = trustchainHandlers.TRUSTCHAIN_STORE_RESET(state, resetTrustchainStore());

    expect(reset.PROD).toBe(VERSIONED_STORE);
    expect(reset.STAGING).toEqual({
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
  });

  it("preserves each trustchain while switching environments", () => {
    const imported = trustchainHandlers.TRUSTCHAIN_STORE_IMPORT_STATE(
      INITIAL_STATE,
      importTrustchainStoreState({ PROD: VERSIONED_STORE }),
    );
    const staging = trustchainHandlers.TRUSTCHAIN_STORE_SET_TRUSTCHAIN(
      trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(imported, setLkrpEnvironment("STAGING")),
      setTrustchain({ ...TRUSTCHAIN, rootId: "staging-root-id" }),
    );
    const prod = trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
      staging,
      setLkrpEnvironment("PROD"),
    );

    expect(trustchainSelector({ trustchain: prod })).toBe(TRUSTCHAIN);
    expect(
      trustchainSelector({
        trustchain: trustchainHandlers.TRUSTCHAIN_STORE_SET_ENVIRONMENT(
          prod,
          setLkrpEnvironment("STAGING"),
        ),
      })?.rootId,
    ).toBe("staging-root-id");
  });

  it("selects the active store and environment", () => {
    const state = {
      trustchain: {
        environment: "STAGING" as const,
        PROD: VERSIONED_STORE,
        STAGING: {
          ...VERSIONED_STORE,
          trustchain: { ...TRUSTCHAIN, rootId: "staging-root-id" },
        },
      },
    };

    expect(lkrpEnvironmentSelector(state)).toBe("STAGING");
    expect(trustchainStoreSelector(state)).toBe(state.trustchain.STAGING);
    expect(trustchainSelector(state)?.rootId).toBe("staging-root-id");
    expect(memberCredentialsSelector(state)).toBe(MEMBER_CREDENTIALS);
  });
});
