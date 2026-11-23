import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { startSandbox } from "./sandbox";

const SANDBOX_URL = "http://localhost:8000";
const instance = {
  instance: "instance-id",
  family: "ethereum",
  network: "sepolia",
};

const monitor = jest.fn();
const server = setupServer(
  http.post(`${SANDBOX_URL}/ethereum/sepolia/up`, () =>
    HttpResponse.json(
      { ...instance, status: "preparing" },
      { status: 202, headers: { Location: "/monitor", "Retry-After": "0" } },
    ),
  ),
  http.get(`${SANDBOX_URL}/monitor`, () => monitor()),
  http.post(`${SANDBOX_URL}/ethereum/sepolia/down`, () => HttpResponse.json({})),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  monitor.mockReset();
});

describe("startSandbox", () => {
  it("should keep waiting when the sandbox instance is preparing", async () => {
    monitor
      .mockReturnValueOnce(HttpResponse.json({ ...instance, status: "preparing" }))
      .mockReturnValueOnce(
        HttpResponse.json({
          ...instance,
          status: "up",
          endpoints: { rpc: "http://localhost:8545" },
        }),
      );

    const sandbox = await startSandbox(
      { family: "ethereum", network: "sepolia" },
      {},
      { intervalMs: 0 },
    );

    expect(monitor).toHaveBeenCalledTimes(2);
    expect(sandbox.endpoints).toEqual({ rpc: "http://localhost:8545" });
    await sandbox.down();
  });

  it("should fail when the sandbox instance is being stopped", async () => {
    monitor.mockReturnValueOnce(HttpResponse.json({ ...instance, status: "stopping" }));

    await expect(
      startSandbox({ family: "ethereum", network: "sepolia" }, {}, { intervalMs: 0 }),
    ).rejects.toThrow("instance-id is being stopped");

    expect(monitor).toHaveBeenCalledTimes(1);
  });
});
