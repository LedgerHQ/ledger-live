import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { fetchKeyRingServiceStatus } from "./serviceStatus";

const server = setupServer(
  http.get("https://trustchain.test/_info", () =>
    HttpResponse.json({ name: "trustchain-backend", version: "1.2.3" }),
  ),
  http.get("https://broken.test/_info", () => HttpResponse.json({ name: 42 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

describe("fetchKeyRingServiceStatus", () => {
  it("reads the status of the key ring backend", async () => {
    await expect(fetchKeyRingServiceStatus("https://trustchain.test")).resolves.toEqual({
      name: "trustchain-backend",
      version: "1.2.3",
    });
  });

  it("rejects a status of an unexpected shape", async () => {
    await expect(fetchKeyRingServiceStatus("https://broken.test")).rejects.toThrow(
      /expected string/,
    );
  });
});
