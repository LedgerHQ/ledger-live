import { InvalidTransactionError } from "@ledgerhq/coin-module-framework/errors";
import { isGatewayEnabled, submit } from "../../network/gateway";
import { createMockCoinConfigValue, createMockContext } from "../../test/fixtures";
import { broadcast } from "../broadcast";

jest.mock("../../network/gateway", () => ({
  submit: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedSubmit = jest.mocked(submit);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);
const mockConfig = createMockCoinConfigValue();
const mockContext = createMockContext(mockConfig);

const PARTY = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const signedTx = JSON.stringify({
  party: PARTY,
  serialized: "serialized-data",
  signature: "signature",
});

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsGatewayEnabled.mockReturnValue(true);
  });

  it("should submit under the transaction's party and return the update id", async () => {
    mockedSubmit.mockResolvedValue({ submission_id: "test-id", update_id: "test-update-id" });

    const result = await broadcast(mockContext, signedTx);

    expect(mockedSubmit).toHaveBeenCalledWith(mockConfig, PARTY, "serialized-data", "signature");
    expect(result).toEqual("test-update-id");
  });

  it.each([
    ["an empty", { submission_id: "test-id", update_id: "" }],
    ["no", { submission_id: "test-id" }],
  ])("should reject a submission that returns %s update id", async (_, response) => {
    mockedSubmit.mockResolvedValue(response as Awaited<ReturnType<typeof submit>>);

    await expect(broadcast(mockContext, signedTx)).rejects.toThrow(
      "canton: broadcast returned no transaction id",
    );
  });

  it("should reject a transaction that is not a signed Canton transaction", async () => {
    await expect(broadcast(mockContext, "serialized-data")).rejects.toThrow(
      InvalidTransactionError,
    );
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockedIsGatewayEnabled.mockReturnValue(false);

    await expect(broadcast(mockContext, signedTx)).rejects.toThrow("Not implemented");
    expect(mockedSubmit).not.toHaveBeenCalled();
  });
});
