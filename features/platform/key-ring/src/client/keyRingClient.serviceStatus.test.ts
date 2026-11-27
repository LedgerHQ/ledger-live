import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { keyRingInitialState } from "@domain/entity-key-ring";
import { createKeyRingV1DeviceBridge } from "../v1";
import { keyRingRuntimeExtra } from "../state/runtime";
import { createKeyRingClient } from "./keyRingClient";

const status = jest.fn<Response, [{ request: Request }]>();
const server = setupServer(http.get("https://trustchain.test/_info", status));
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => status.mockReset());
afterAll(() => server.close());

function client(mock: boolean) {
  return createKeyRingClient({
    mock,
    instanceName: "Test instance",
    apiBaseUrl: "https://trustchain.test",
    deviceBridge: createKeyRingV1DeviceBridge({
      withDevice: jest.fn(),
      createSessionTransport: jest.fn(),
    }),
    runtime: keyRingRuntimeExtra({ getState: () => ({ trustchain: keyRingInitialState }) })
      .keyRingRuntime,
  });
}

describe("KeyRingClient.serviceStatus", () => {
  it.each([
    ["the app client", false],
    ["the mock environment client", true],
  ])("should read the status of the key ring backend for %s", async (_case, mock) => {
    status.mockReturnValue(HttpResponse.json({ name: "trustchain-backend", version: "1.2.3" }));

    await expect(client(mock).serviceStatus()).resolves.toEqual({
      name: "trustchain-backend",
      version: "1.2.3",
    });
    expect(status).toHaveBeenCalledTimes(1);
  });

  it("should read it from a client bound to a device session too", async () => {
    status.mockReturnValue(HttpResponse.json({ name: "trustchain-backend", version: "1.2.3" }));
    const sessionClient = client(false).forDeviceSession({ dmk: {} as never, sessionId: "s-1" });

    await expect(sessionClient.serviceStatus()).resolves.toMatchObject({ version: "1.2.3" });
  });

  it("should reject a status of an unexpected shape", async () => {
    status.mockReturnValue(HttpResponse.json({ name: 42 }));

    await expect(client(false).serviceStatus()).rejects.toThrow(/expected string/);
  });

  it("should reject with the transport error as is", async () => {
    status.mockReturnValue(HttpResponse.json({ message: "No such trustchain" }, { status: 404 }));

    await expect(client(false).serviceStatus()).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      message: "No such trustchain",
    });
  });
});
