import { isGatewayEnabled, submit } from "../../network/gateway";
import { createMockCantonCurrency } from "../../test/fixtures";
import { broadcast } from "./broadcast";

jest.mock("../../network/gateway", () => ({
  submit: jest.fn(),
  isGatewayEnabled: jest.fn(() => true),
}));

const mockedSubmit = jest.mocked(submit);
const mockedIsGatewayEnabled = jest.mocked(isGatewayEnabled);
const mockCurrency = createMockCantonCurrency();

const mockSerialized = JSON.stringify({
  serialized: "serialized-data",
  signature:
    "signature__PARTY__alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
});

describe("broadcast", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast", async () => {
    mockedIsGatewayEnabled.mockReturnValue(true);
    mockedSubmit.mockResolvedValue({ submission_id: "test-id", update_id: "test-update-id" });

    const result = await broadcast(mockCurrency, mockSerialized);

    expect(mockedSubmit).toHaveBeenCalledWith(
      mockCurrency,
      "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
      "serialized-data",
      "signature",
    );
    expect(result).toEqual("test-update-id");
  });

  it("should throw an error when useGateway is false (not implemented with node)", async () => {
    mockedIsGatewayEnabled.mockReturnValue(false);

    await expect(broadcast(mockCurrency, mockSerialized)).rejects.toThrow("Not implemented");
    expect(mockedSubmit).not.toHaveBeenCalled();
  });
});
