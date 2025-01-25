import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { ScenarioOptions } from "./types";
import { getSdk } from "../../src";
import { WithDevice } from "../../src/types";

setEnv("GET_CALLS_RETRY", 0);

export async function replayTrustchainSdkTests<Json extends JsonShape>(
  json: Json,
  scenario: (deviceId: string, scenarioOptions: ScenarioOptions) => Promise<void>,
) {
  // This replays, in order, all HTTP queries we have saved in json records
  let httpTransactionIndex = 0;
  const mockServer = setupServer(
    http.all("*", async ({ request }) => {
      const id = "http(" + httpTransactionIndex + "): ";
      const expected = json.http.transactions[httpTransactionIndex++];
      if (!expected) {
        throw new Error("unexpected HTTP request has occured: " + request.url.toString());
      }
      expect(id + request.method + " " + request.url.toString()).toEqual(
        id + expected.request.method + " " + expected.request.url,
      );

      expect({
        url: request.url.toString(),
        method: request.method,
        body: request.body ? await request.text() : undefined,
        headers: headersToJson(request.headers),
      }).toEqual({
        url: expected.request.url,
        method: expected.request.method,
        body: expected.request.body,
        headers: expected.request.headers,
      });

      const response = new HttpResponse(expected.response.body, {
        status: expected.response.status,
        headers: expected.response.headers as Record<string, string>,
      });
      HttpResponse.json;
      return response;
    }),
  );

  // This replays, in order, all crypto randomKeypair we have saved in json records
  let randomKeypairIndex = 0;
  jest.spyOn(crypto, "randomKeypair").mockImplementation(() => {
    const emits = json.crypto.randomKeypairOutputs[randomKeypairIndex++];
    if (!emits) {
      throw new Error("unexpected randomKeypair call");
    }
    const privateKey = crypto.from_hex(emits);
    return crypto.keypairFromSecretKey(privateKey);
  });

  // This replays, in order, all crypto randomBytes we have saved in json records
  let randomBytesIndex = 0;
  jest.spyOn(crypto, "randomBytes").mockImplementation((size: number) => {
    const emits = json.crypto.randomBytesOutputs[randomBytesIndex++];
    if (!emits) {
      throw new Error("unexpected randomBytes call");
    }
    const bytes = crypto.from_hex(emits);
    if (bytes.length !== size) {
      throw new Error("unexpected randomBytes size. Expected " + size + " but got " + bytes.length);
    }
    return bytes;
  });

  const recordStore = RecordStore.fromString(json.apdus);

  mockServer.listen();
  mockServer.resetHandlers();
  try {
    // This replays, in order, all APDUs we have saved in json records
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
      pauseRecorder: () => Promise.resolve(), // replayer don't need to pause
      switchDeviceSeed: async () => device, // nothing to actually do, we will continue replaying
    };
    await scenario(device.id, options);
  } finally {
    mockServer.close();
  }

  // verify we have consumed all the expected calls
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
        headers: unknown;
      };
      response: {
        status: number;
        headers: unknown;
        body?: string;
      };
    }[];
  };
  crypto: {
    randomKeypairOutputs: string[];
    randomBytesOutputs: string[];
  };
};

function headersToJson(headers) {
  const obj: Record<string, string> = {};
  for (const [key, value] of headers) {
    obj[key] = value;
  }
  return obj;
}
