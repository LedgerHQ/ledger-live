import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { ScenarioOptions } from "./types";
import { getSdk } from "../../src";
import { WithDevice } from "../../src/types";

setEnv("GET_CALLS_RETRY", 0);

/**
 * Volatile headers added by Node.js or MSW that vary between versions.
 */
const VOLATILE_HEADERS = new Set([
  "user-agent",
  "content-length",
  "connection",
  "accept-encoding",
  "host",
]);

/**
 * Normalizes Headers into a plain object for stable comparison.
 */
function getCleanHeaders(headers: Headers): Record<string, string> {
  const clean: Record<string, string> = {};
  headers.forEach((value, key) => {
    const lowKey = key.toLowerCase();
    if (!VOLATILE_HEADERS.has(lowKey)) {
      clean[lowKey] = value;
    }
  });
  return clean;
}

/**
 * Helper to convert the recorded headers (unknown/object) into a Headers instance
 */
function toHeaders(recordHeaders: unknown): Headers {
  const headers = new Headers();
  if (recordHeaders && typeof recordHeaders === "object") {
    Object.entries(recordHeaders).forEach(([key, value]) => {
      if (typeof value === "string") {
        headers.append(key, value);
      }
    });
  }
  return headers;
}

export async function replayTrustchainSdkTests<Json extends JsonShape>(
  json: Json,
  scenario: (deviceId: string, scenarioOptions: ScenarioOptions) => Promise<void>,
) {
  let httpTransactionIndex = 0;

  const mockServer = setupServer(
    http.all("*", async ({ request }) => {
      const id = `http(${httpTransactionIndex}): `;
      const expected = json.http.transactions[httpTransactionIndex++];

      if (!expected) {
        throw new Error(`${id}unexpected HTTP request: ${request.method} ${request.url}`);
      }

      // MSW 2.7.3+ normalization: Extract body as text.
      // Treat empty strings as undefined to match legacy JSON records.
      const rawBody = await request.text();
      const actualBody = rawBody === "" ? undefined : rawBody;
      const expectedBody = expected.request.body === "" ? undefined : expected.request.body;

      expect({
        method: request.method,
        url: request.url.toString(),
        body: actualBody,
        headers: getCleanHeaders(request.headers),
      }).toEqual({
        method: expected.request.method,
        url: expected.request.url,
        body: expectedBody,
        headers: getCleanHeaders(toHeaders(expected.request.headers)),
      });

      return new HttpResponse(expected.response.body, {
        status: expected.response.status,
        headers: expected.response.headers as Record<string, string>,
      });
    }),
  );

  // Replay crypto spies
  let randomKeypairIndex = 0;
  jest.spyOn(crypto, "randomKeypair").mockImplementation(() => {
    const emits = json.crypto.randomKeypairOutputs[randomKeypairIndex++];
    if (!emits) throw new Error("unexpected randomKeypair call");
    const privateKey = crypto.from_hex(emits);
    return crypto.keypairFromSecretKey(privateKey);
  });

  let randomBytesIndex = 0;
  jest.spyOn(crypto, "randomBytes").mockImplementation((size: number) => {
    const emits = json.crypto.randomBytesOutputs[randomBytesIndex++];
    if (!emits) throw new Error("unexpected randomBytes call");
    const bytes = crypto.from_hex(emits);
    if (bytes.length !== size) {
      throw new Error(`unexpected randomBytes size. Expected ${size} but got ${bytes.length}`);
    }
    return bytes;
  });

  const recordStore = RecordStore.fromString(json.apdus);

  mockServer.listen();
  mockServer.resetHandlers();

  try {
    const transport = await openTransportReplayer(recordStore);
    const device = { id: "", transport };
    const withDevice: WithDevice = () => fn => fn(device.transport);

    const options: ScenarioOptions = {
      withDevice,
      sdkForName: name =>
        getSdk(
          !!getEnv("MOCK"),
          { applicationId: 16, name, apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING") },
          withDevice,
        ),
      pauseRecorder: () => Promise.resolve(),
      switchDeviceSeed: async () => device,
    };

    await scenario(device.id, options);
  } finally {
    mockServer.close();
    jest.restoreAllMocks();
  }

  expect({
    httpCalls: httpTransactionIndex,
    randomKeypairCalls: randomKeypairIndex,
    randomBytesCalls: randomBytesIndex,
  }).toEqual({
    httpCalls: json.http.transactions.length,
    randomKeypairCalls: json.crypto.randomKeypairOutputs.length,
    randomBytesCalls: json.crypto.randomBytesOutputs.length,
  });
}

type JsonShape = {
  apdus: string;
  http: {
    transactions: {
      request: {
        url: string;
        method: string;
        body?: string;
        headers: Record<string, unknown>;
      };
      response: {
        status: number;
        headers: Record<string, string>;
        body?: string;
      };
    }[];
  };
  crypto: {
    randomKeypairOutputs: string[];
    randomBytesOutputs: string[];
  };
};
