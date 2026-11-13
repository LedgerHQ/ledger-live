import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { addressFromPublicKey } from "../address";
import { getAccountStatus } from "../getAccountStatus";

const PUBLIC_KEY = "ab".repeat(32);

describe("getAccountStatus", () => {
  const server = setupServer();
  const asked = jest.fn();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("reads the wallet address of the public key", async () => {
    server.use(
      http.get(`${TON_API_MOCKED}/account`, ({ request }) => {
        asked(new URL(request.url).searchParams.get("address"));
        return HttpResponse.json({ balance: "1000", last_transaction_lt: null, status: "uninit" });
      }),
    );
    await expect(getAccountStatus(createMockTonContext(), PUBLIC_KEY)).resolves.toEqual({
      used: true,
    });
    expect(asked).toHaveBeenCalledWith(addressFromPublicKey(PUBLIC_KEY));
  });
});
