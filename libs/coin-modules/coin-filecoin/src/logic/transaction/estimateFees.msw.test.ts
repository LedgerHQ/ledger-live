import { getEnv } from "@ledgerhq/live-env";
import { estimateFees } from "./estimateFees";
import {
  server,
  filecoinHandlers,
  TEST_ENDPOINT,

} from "../tests/helpers/msw-api.mock";
import { TEST_ADDRESSES } from "../../test/fixtures";

jest.mock("@ledgerhq/live-env");
jest.mock("../../network");

jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return TEST_ENDPOINT;
  return "" as any;
});

// Mock network module exports
const { validateAddress, convertAddressFilToEth } = jest.requireMock("../../network") as {
  validateAddress: jest.Mock;
  convertAddressFilToEth: jest.Mock;
};
validateAddress.mockImplementation((addr: string) => ({
  isValid: true,
  parsedAddress: { toString: () => addr },
}));
// convertAddressFilToEth: pass through 0x addresses as-is
convertAddressFilToEth.mockImplementation((addr: string) => addr);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("estimateFees (MSW integration)", () => {
  it("estimates fees for a native FIL transfer via the API", async () => {
    let capturedBody: unknown;

    server.use(
      ...filecoinHandlers({
        estimateFees: body => {
          capturedBody = body;
          return {
            gas_limit: 30000,
            gas_fee_cap: "200000",
            gas_premium: "5000",
            nonce: 12,
          };
        },
      }),
    );

    const result = await estimateFees({
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: TEST_ADDRESSES.RECIPIENT_F1,
      amount: 1000000000000000000n,
      asset: { type: "native" },
    });

    // value = gasFeeCap * gasLimit = 200000 * 30000 = 6000000000
    expect(result.value).toBe(6000000000n);
    expect(result.parameters).toEqual({
      gasLimit: 30000,
      gasFeeCap: "200000",
      gasPremium: "5000",
      nonce: 12,
    });

    expect(capturedBody).toMatchObject({
      from: TEST_ADDRESSES.F1_ADDRESS,
      to: TEST_ADDRESSES.RECIPIENT_F1,
      methodNum: 0,
    });
  });

  it("sends method InvokeEVM for token transfers", async () => {
    let capturedBody: unknown;

    server.use(
      ...filecoinHandlers({
        estimateFees: body => {
          capturedBody = body;
          return {
            gas_limit: 50000,
            gas_fee_cap: "100000",
            gas_premium: "3000",
            nonce: 8,
          };
        },
      }),
    );

    await estimateFees({
      sender: TEST_ADDRESSES.F1_ADDRESS,
      recipient: "0x000000000000000000000000000000000000dEaD",
      amount: 500n,
      asset: { type: "token", assetReference: TEST_ADDRESSES.ERC20_CONTRACT },
    });

    expect((capturedBody as Record<string, unknown>).methodNum).toBe(3844450837);
    expect(capturedBody).toHaveProperty("params");
    expect(capturedBody).toHaveProperty("value", "0");
  });
});
