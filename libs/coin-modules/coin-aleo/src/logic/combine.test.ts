import { sdkClient } from "../network/sdk";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { getMockedPreparedRequestResponse } from "../__tests__/fixtures/sdk.fixture";
import type { AuthorizationResponse } from "../types/sdk";
import { combine } from "./combine";
import { fromHex, toHex } from "./utils";

jest.mock("../network/sdk");

const mockedCreateAuthorization = jest.mocked(sdkClient.createAuthorization);

describe("combine", () => {
  const config = getMockedConfig("testnet");
  const viewKey = "AViewKey1test000000000000000000000000000000000000000";
  const authorizationResponse: AuthorizationResponse = {
    authorization: "tx-auth",
    execution_id: "exec-id",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateAuthorization.mockResolvedValue(authorizationResponse);
  });

  it("forwards the crafted request, signatures and view key to createAuthorization", async () => {
    const request = getMockedPreparedRequestResponse();

    await combine({
      config,
      transaction: toHex(request),
      signatures: ["root-sig"],
      viewKey,
    });

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(1);
    expect(mockedCreateAuthorization).toHaveBeenCalledWith({
      config,
      request,
      signatures: ["root-sig"],
      viewKey,
    });
  });

  it("returns hex(AuthorizationResponse) exposing both authorization and execution_id", async () => {
    const request = getMockedPreparedRequestResponse();

    const result = await combine({
      config,
      transaction: toHex(request),
      signatures: ["root-sig"],
      viewKey,
    });

    expect(fromHex<AuthorizationResponse>(result)).toEqual(authorizationResponse);
  });

  it("forwards root + nested signatures in the given order, root first", async () => {
    const request = getMockedPreparedRequestResponse({
      nested_calls: [
        getMockedPreparedRequestResponse({ is_root: false, tlv: "aabb" }),
        getMockedPreparedRequestResponse({ is_root: false, tlv: "ccdd" }),
      ],
    });

    await combine({
      config,
      transaction: toHex(request),
      signatures: ["root-sig", "nested-sig-1", "nested-sig-2"],
      viewKey,
    });

    expect(mockedCreateAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        signatures: ["root-sig", "nested-sig-1", "nested-sig-2"],
      }),
    );
  });

  it("counts deeply nested calls when validating the signature count", async () => {
    const request = getMockedPreparedRequestResponse({
      nested_calls: [
        getMockedPreparedRequestResponse({
          is_root: false,
          nested_calls: [getMockedPreparedRequestResponse({ is_root: false })],
        }),
      ],
    });

    await combine({
      config,
      transaction: toHex(request),
      signatures: ["root-sig", "nested-sig-1", "nested-sig-2"],
      viewKey,
    });

    expect(mockedCreateAuthorization).toHaveBeenCalledTimes(1);
  });

  describe("signature-list validation (rejects before any network call)", () => {
    it("rejects an empty signature list", async () => {
      const request = getMockedPreparedRequestResponse();

      await expect(
        combine({
          config,
          transaction: toHex(request),
          signatures: [],
          viewKey,
        }),
      ).rejects.toThrow("aleo: combine requires at least one signature");
      expect(mockedCreateAuthorization).not.toHaveBeenCalled();
    });

    it("rejects more than 31 signatures on a root cycle", async () => {
      const request = getMockedPreparedRequestResponse();
      const signatures = Array.from({ length: 32 }, (_, i) => `sig-${i}`);

      await expect(
        combine({ config, transaction: toHex(request), signatures, viewKey }),
      ).rejects.toThrow("aleo: too many signatures for a single transaction (max 31)");
      expect(mockedCreateAuthorization).not.toHaveBeenCalled();
    });

    it("rejects a fee-cycle craft (no nested calls) combined with more than one signature", async () => {
      const feeRequest = getMockedPreparedRequestResponse({
        function_name: "fee_public",
      });

      await expect(
        combine({
          config,
          transaction: toHex(feeRequest),
          signatures: ["fee-sig", "extra-sig"],
          viewKey,
        }),
      ).rejects.toThrow("aleo: expected 1 signature(s) but received 2");
      expect(mockedCreateAuthorization).not.toHaveBeenCalled();
    });

    it("rejects a signature count that does not match the transition count", async () => {
      const request = getMockedPreparedRequestResponse({
        nested_calls: [getMockedPreparedRequestResponse({ is_root: false })],
      });

      await expect(
        combine({
          config,
          transaction: toHex(request),
          signatures: ["root-sig"],
          viewKey,
        }),
      ).rejects.toThrow("aleo: expected 2 signature(s) but received 1");
      expect(mockedCreateAuthorization).not.toHaveBeenCalled();
    });
  });
});
