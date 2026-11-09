import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { TON_API_MOCKED, createMockTonContext } from "../../test/context";
import { OWNER, OWNER_JETTON_WALLET_RAW, OWNER_RAW } from "../../test/history.fixtures";
import { exists } from "../exists";

const account = (over: object) => ({
  balance: "0",
  code: null,
  data: null,
  last_transaction_lt: null,
  last_transaction_hash: null,
  frozen_hash: null,
  status: "nonexist",
  ...over,
});

const jettonWallet = (balance: string) => ({
  address: OWNER_JETTON_WALLET_RAW,
  balance,
  owner: OWNER_RAW,
  jetton: "0:729C13B6DF2C07CBF0A06AB63D34AF454F3D320EC1BCD8FB5C6D24D0806A17C2",
  last_transaction_lt: "48954545000001",
  code_hash: "code",
  data_hash: "data",
});

describe("exists", () => {
  const server = setupServer();
  const context = createMockTonContext();
  const jettonCalls = jest.fn();

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    jettonCalls.mockClear();
  });
  afterAll(() => server.close());

  const serve = (info: object, jettons: object[] = []) =>
    server.use(
      http.get(`${TON_API_MOCKED}/account`, () => HttpResponse.json(account(info))),
      http.get(`${TON_API_MOCKED}/jetton/wallets`, () => {
        jettonCalls();
        return HttpResponse.json({ jetton_wallets: jettons });
      }),
    );

  it("is true for an address with a transaction, in one call", async () => {
    serve({ last_transaction_lt: "1", status: "active" });
    await expect(exists(context, OWNER)).resolves.toBe(true);
    expect(jettonCalls).not.toHaveBeenCalled();
  });

  it("is true for an uninitialized address holding TON", async () => {
    serve({ balance: "1000", status: "uninit" });
    await expect(exists(context, OWNER)).resolves.toBe(true);
  });

  it("is true for an address that only holds a jetton", async () => {
    serve({}, [jettonWallet("500000")]);
    await expect(exists(context, OWNER)).resolves.toBe(true);
  });

  it("is false for an address with no history", async () => {
    serve({}, [jettonWallet("0")]);
    await expect(exists(context, OWNER)).resolves.toBe(false);
  });
});
