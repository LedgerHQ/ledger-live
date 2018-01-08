//@flow
import URL from "url";
import { denormalize } from "normalizr-gre";
import mockEntities from "./mock-entities.js";
import schema from "./schema";

const mockSync = (uri: string, method: string, body: ?Object) => {
  const q = URL.parse(uri, true);
  if (method === "POST" && q.pathname === "/helloworld") {
    if (!body) return;
    return { echo: body.echo };
  }
  if (method === "GET" && q.pathname === "/currencies") {
    return denormalize(
      Object.keys(mockEntities.currencies),
      [schema.Currency],
      mockEntities
    );
  }
};

const delay = ms => new Promise(success => setTimeout(success, ms));

export default (uri: string, init: *): ?Promise<*> => {
  const method = typeof init.method === "string" ? init.method : "GET";
  const body = typeof init.body === "string" ? JSON.parse(init.body) : null;
  const mockRes = mockSync(uri, method, body);
  if (mockRes) {
    return delay(300 + 800 * Math.random())
      .then(() => {
        console.warn(
          "mock: " + method + " " + uri,
          body || "",
          "\n=>",
          mockRes
        );
        // if (Math.random() < 0.3) throw new Error("MOCK_HTTP_FAILURE");
        return {
          status: 200,
          json: () => Promise.resolve(mockRes)
        };
      })
      .catch(e => {
        console.warn("mock: " + method + " " + uri + " FAILED", e);
        throw e;
      });
  } else {
    return null;
  }
};
