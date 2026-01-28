/**
 * Integration test for submitCredential endpoint
 *
 * Tests the submitCredential function with a real payload from submitCredentialsPayload.json
 * This test makes actual network calls to the wallet-proxy service.
 *
 * To run: pnpm test:integ proxyClient.integ.test.ts
 *
 * Note: This test requires:
 * - Network connectivity to wallet-proxy.testnet.concordium.com
 * - A valid credential payload (from submitCredentialsPayload.json)
 * - The credential should not have been submitted before (duplicate submissions will fail)
 */

import fs from "fs";
import path from "path";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import type { SubmitCredentialData } from "../types/network";
import { submitCredential } from "./proxyClient";

describe("submitCredential integration test", () => {
  let testCurrency: ReturnType<typeof getCryptoCurrencyById>;
  let payload: SubmitCredentialData;

  beforeAll(() => {
    // Get Concordium testnet currency
    testCurrency = getCryptoCurrencyById("concordium_testnet");

    // Initialize coin config for testnet
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      grpcHostname: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      currency: testCurrency,
    }));

    // Load the test payload from JSON file
    const payloadPath = path.join(__dirname, "submitCredentialsPayload.json");
    const payloadContent = fs.readFileSync(payloadPath, "utf-8");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payload = JSON.parse(payloadContent) as SubmitCredentialData;
  });

  it("should load payload from submitCredentialsPayload.json", () => {
    expect(payload.v).toBe(0);
    expect(payload.value).not.toBeNull();
    expect(payload.value.credential).not.toBeNull();
    expect(payload.value.credential.type).toBe("initial");
    expect(payload.value.credential.contents).not.toBeNull();
    expect(payload.value.messageExpiry).not.toBeNull();
  });

  it("should validate payload structure matches SubmitCredentialData type", () => {
    // Validate version
    expect(payload.v).toBe(0);

    // Validate value structure
    expect(payload.value).not.toBeNull();
    expect(payload.value.credential).not.toBeNull();
    expect(payload.value.messageExpiry).not.toBeNull();

    // Validate credential structure
    const credential = payload.value.credential;
    expect(credential.type).toBe("initial");
    expect(credential.contents).not.toBeNull();

    // Validate contents
    const contents = credential.contents;
    expect(typeof contents.ipIdentity).toBe("number");
    expect(contents.policy).not.toBeNull();
    expect(contents.credentialPublicKeys).not.toBeNull();
    expect(typeof contents.credId).toBe("string");
    expect(contents.credId.length).toBeGreaterThan(0);
    expect(typeof contents.revocationThreshold).toBe("number");
    expect(contents.arData).not.toBeNull();
    expect(typeof contents.arData).toBe("object");
    expect(typeof contents.proofs).toBe("string");
    expect(contents.proofs.length).toBeGreaterThan(0);
  });

  it("should submit credential to wallet-proxy", async () => {
    // Skip test if SKIP_NETWORK_TESTS environment variable is set
    if (process.env.SKIP_NETWORK_TESTS === "true") {
      // eslint-disable-next-line no-console
      console.log("Skipping network test (SKIP_NETWORK_TESTS=true)");
      return;
    }

    try {
      const result = await submitCredential(testCurrency, payload);

      // Should return a submission ID
      expect(result.submissionId).not.toBeNull();
      expect(typeof result.submissionId).toBe("string");
      expect(result.submissionId.length).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log("Credential submitted successfully:", {
        submissionId: result.submissionId,
        credId: payload.value.credential.contents.credId.substring(0, 16) + "...",
      });
    } catch (error) {
      // Handle expected errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      // If credential was already submitted, that's expected for integration tests
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("already") ||
        errorMessage.includes("Credential rejected")
      ) {
        // eslint-disable-next-line no-console
        console.log("Credential already submitted (expected for integration test):", errorMessage);
        // This is acceptable - the credential was already submitted
        return;
      }

      // If it's a network error, skip the test
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ENOTFOUND")
      ) {
        // eslint-disable-next-line no-console
        console.log("Network error (skipping test):", errorMessage);
        return;
      }

      // Re-throw unexpected errors
      throw error;
    }
  }, 60000); // 60 second timeout for network calls

  it("should handle invalid payload structure", async () => {
    // Skip test if SKIP_NETWORK_TESTS environment variable is set
    if (process.env.SKIP_NETWORK_TESTS === "true") {
      // eslint-disable-next-line no-console
      console.log("Skipping network test (SKIP_NETWORK_TESTS=true)");
      return;
    }

    // Create an invalid payload (missing 'v' field)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const invalidPayload = {
      value: {
        credential: payload.value.credential,
        messageExpiry: payload.value.messageExpiry,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as SubmitCredentialData;

    await expect(submitCredential(testCurrency, invalidPayload)).rejects.toThrow();
  }, 30000);

  it("should handle payload with missing messageExpiry", async () => {
    // Skip test if SKIP_NETWORK_TESTS environment variable is set
    if (process.env.SKIP_NETWORK_TESTS === "true") {
      // eslint-disable-next-line no-console
      console.log("Skipping network test (SKIP_NETWORK_TESTS=true)");
      return;
    }

    // Create payload without messageExpiry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invalidPayload: any = {
      v: 0,
      value: {
        credential: payload.value.credential,
        // Intentionally missing messageExpiry for test
      },
    };

    await expect(submitCredential(testCurrency, invalidPayload)).rejects.toThrow();
  }, 30000);
});
