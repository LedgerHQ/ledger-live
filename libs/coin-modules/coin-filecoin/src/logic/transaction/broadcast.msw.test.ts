import { getEnv } from "@ledgerhq/live-env";
import { broadcast } from "./broadcast";
import {
  server,
  filecoinHandlers,
  TEST_ENDPOINT,

} from "../tests/helpers/msw-api.mock";

jest.mock("@ledgerhq/live-env");
jest.mocked(getEnv).mockImplementation((key: string) => {
  if (key === "API_FILECOIN_ENDPOINT") return TEST_ENDPOINT;
  return "" as any;
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("broadcast (MSW integration)", () => {
  it("broadcasts a signed transaction and returns the hash", async () => {
    let capturedBody: unknown;

    server.use(
      ...filecoinHandlers({
        broadcast: body => {
          capturedBody = body;
          return { hash: "bafy2txresult" };
        },
      }),
    );

    const signedTx = JSON.stringify({
      message: {
        version: 0,
        to: "f1recipient",
        from: "f1sender",
        nonce: 5,
        value: "1000000000000000000",
        gaslimit: 25000,
        gasfeecap: "100000",
        gaspremium: "2500",
        method: 0,
        params: "",
      },
      signature: { type: 1, data: "base64sig==" },
    });

    const hash = await broadcast(signedTx);

    expect(hash).toBe("bafy2txresult");
    expect(capturedBody).toMatchObject({
      message: expect.objectContaining({ to: "f1recipient", from: "f1sender" }),
      signature: expect.objectContaining({ type: 1 }),
    });
  });
});
