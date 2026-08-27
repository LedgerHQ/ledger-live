import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Session } from "../session/session-store";
import {
  inMemoryMemberCredentialRepository,
  withInMemoryMemberCredentialRepository,
} from "../test/helpers/in-memory-member-credential-repository";
import { deriveWrappingKey } from "./crypto";
import { KeychainReadError, savePrivateKey } from "./keychain";
import { loadWalletCliTrustchainStore } from "./load-auth-trustchain-store";

const loadProductionTrustchainStore = () =>
  withInMemoryMemberCredentialRepository(() => loadWalletCliTrustchainStore());

describe("loadWalletCliTrustchainStore", () => {
  let stateDir: string;
  let previousStateDir: string | undefined;

  beforeEach(() => {
    stateDir = mkdtempSync(join(tmpdir(), "wallet-cli-auth-test-"));
    previousStateDir = process.env.XDG_STATE_HOME;
    process.env.XDG_STATE_HOME = stateDir;
    inMemoryMemberCredentialRepository.clear();
  });

  afterEach(() => {
    inMemoryMemberCredentialRepository.setReadError(undefined);
    if (previousStateDir === undefined) {
      delete process.env.XDG_STATE_HOME;
    } else {
      process.env.XDG_STATE_HOME = previousStateDir;
    }
    rmSync(stateDir, { recursive: true, force: true });
  });

  it("should persist and reuse a generated credential across authentication", async () => {
    const first = await loadProductionTrustchainStore();
    const second = await loadProductionTrustchainStore();

    expect(first.trustchain).toBeNull();
    expect(second.memberCredentials).toEqual(first.memberCredentials);
    expect(inMemoryMemberCredentialRepository.entries.size).toBe(1);
  });

  it("should not replace missing credentials for an initialized ring", async () => {
    const session = Session.from([]);
    session.setTrustchain({
      rootId: "wallet-cli-root",
      applicationPath: "m/0'/17'/0'",
    });
    session.write();

    await expect(loadProductionTrustchainStore()).rejects.toThrow(/member credentials not found/i);
    expect(inMemoryMemberCredentialRepository.entries.size).toBe(0);
  });

  it("should report missing password metadata for a protected credential", async () => {
    const memberCredentials = initMemberCredentials();
    const wrappingKey = await deriveWrappingKey("test-password", "0".repeat(32));
    await withInMemoryMemberCredentialRepository(() =>
      savePrivateKey(memberCredentials.privatekey, memberCredentials.pubkey, wrappingKey),
    );

    await expect(loadProductionTrustchainStore()).rejects.toThrow(
      /password metadata is missing.*ring destroy.*ring init/i,
    );
  });

  it("should isolate credentials by state profile", async () => {
    const otherStateDir = mkdtempSync(join(tmpdir(), "wallet-cli-auth-test-"));
    try {
      const firstProfile = await loadProductionTrustchainStore();

      process.env.XDG_STATE_HOME = otherStateDir;
      const secondProfile = await loadProductionTrustchainStore();

      process.env.XDG_STATE_HOME = stateDir;
      const restoredFirstProfile = await loadProductionTrustchainStore();

      expect(restoredFirstProfile.memberCredentials).toEqual(firstProfile.memberCredentials);
      expect(secondProfile.memberCredentials).not.toEqual(firstProfile.memberCredentials);
      expect(inMemoryMemberCredentialRepository.entries.size).toBe(2);
    } finally {
      process.env.XDG_STATE_HOME = stateDir;
      rmSync(otherStateDir, { recursive: true, force: true });
    }
  });

  it("should not replace credentials when the keychain cannot be read", async () => {
    const readError = new Error("Keychain is locked");
    inMemoryMemberCredentialRepository.setReadError(readError);

    const error = await loadProductionTrustchainStore().catch(error => error);
    expect(error).toBeInstanceOf(KeychainReadError);
    expect(error).toHaveProperty("message", "Keychain is locked");
    expect(error).toHaveProperty("cause", readError);
    expect(inMemoryMemberCredentialRepository.entries.size).toBe(0);
  });

  it("should reuse ring credentials and include the trustchain root", async () => {
    const memberCredentials = initMemberCredentials();
    const session = Session.from([]);
    session.setTrustchain({
      rootId: "wallet-cli-root",
      applicationPath: "m/0'/17'/0'",
    });
    session.write();
    await withInMemoryMemberCredentialRepository(() =>
      savePrivateKey(memberCredentials.privatekey, memberCredentials.pubkey),
    );

    await expect(loadProductionTrustchainStore()).resolves.toEqual({
      trustchain: { rootId: "wallet-cli-root" },
      memberCredentials,
    });
  });
});
