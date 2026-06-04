import fsPromises from "fs/promises";
import zlib from "zlib";
import { setupServer } from "msw/node";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { createSpeculosDevice, releaseSpeculosDevice } from "@ledgerhq/speculos-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { crypto, TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { RecorderConfig, ScenarioOptions, genSeed, recorderConfigDefaults } from "./types";
import { getSdk } from "../../src";
import { WithDevice } from "../../src/types";

setEnv("GET_CALLS_RETRY", 0);

export async function recordTestTrustchainSdk(
  file: string | null,
  scenario: (deviceId: string, scenarioOptions: ScenarioOptions) => Promise<void>,
  config: RecorderConfig,
) {
  const seed = config.seed || genSeed();
  const coinapps = config.coinapps;
  if (!coinapps) throw new Error("coinapps is required"); // it's completed by e2e script

  const goNextOnText = config.goNextOnText || recorderConfigDefaults.goNextOnText;
  const approveOnceOnText = config.approveOnceOnText || [];
  const approveOnText = config.approveOnText || recorderConfigDefaults.approveOnText;

  const buttonClicksPromises: Array<Promise<void>> = [];
  const recordStore = new RecordStore();

  const createDeviceWithSeed = async (seed: string) => {
    const device = await createSpeculosDevice({
      model: DeviceModelId.nanoSP,
      firmware: "1.1.2",
      appName: TRUSTCHAIN_APP_NAME,
      appVersion: "1.0.1",
      seed,
      coinapps, // folder where there is the Ledger Sync coin app
    });

    // passthrough all success cases for the Ledger Sync coin app to accept all.
    const sub = device.transport.automationEvents.subscribe(event => {
      const text =
        typeof event.text === "string" ? event.text.trim() : String(event.text ?? "").trim();
      const approveOnceIndex = approveOnceOnText.findIndex(t => text == t);
      if (approveOnceIndex > -1) {
        approveOnceOnText.splice(approveOnceIndex, 1);
        buttonClicksPromises.push(device.transport.button("both"));
      } else if (goNextOnText.some(t => text == t)) {
        buttonClicksPromises.push(device.transport.button("right"));
      } else if (approveOnText.some(t => text == t)) {
        buttonClicksPromises.push(device.transport.button("both"));
      }
    });

    // monkey patch the transport to record all device APDU exchanges
    const transport = device.transport;
    const originalExchange = transport.exchange;
    transport.exchange = async function (apdu: Buffer) {
      const out = await originalExchange.call(transport, apdu);
      recordStore.recordExchange(apdu, out);
      return out;
    };

    return { device, sub };
  };

  // listen to network with msw to be able to replay in our future tests
  const transactions: Transaction[] = [];
  const bodyReads: Array<Promise<void>> = [];
  // The request body is consumed by the time `response:bypass` fires, so we
  // snapshot it from a clone at `request:start` and merge it back by requestId.
  const requestBodies = new Map<string, string>();
  const server = setupServer();
  server.events.on("request:start", ({ request, requestId }) => {
    if (isSpeculosRequest(request.url)) return; // ignore speculos requests
    if (!request.body) return;
    bodyReads.push(
      request
        .clone()
        .text()
        .then(body => {
          requestBodies.set(requestId, body);
        }),
    );
  });
  server.events.on("response:bypass", ({ response, request, requestId }) => {
    if (isSpeculosRequest(request.url)) return; // ignore speculos requests
    const transaction: Transaction = {
      request: {
        url: request.url,
        method: request.method,
        headers: headersToJson(request.headers),
      },
      response: {
        status: response.status,
        // We store the decoded body (`response.text()`), so drop the headers
        // that describe the wire encoding/length: replaying them would make the
        // client try to gunzip plaintext (`incorrect header check`) or truncate.
        headers: headersToJson(response.headers, DECODED_BODY_HEADERS),
      },
    };
    transactions.push(transaction);
    const requestBody = requestBodies.get(requestId);
    if (requestBody !== undefined) {
      transaction.request.body = requestBody;
      requestBodies.delete(requestId);
    }
    if (response.body) {
      // `response.text()` on a bypassed response yields the still-encoded bytes
      // (the server's content-encoding), so decode by hand and store plaintext.
      const encoding = response.headers.get("content-encoding")?.toLowerCase();
      bodyReads.push(
        response
          .clone()
          .arrayBuffer()
          .then(buffer => {
            transaction.response.body = decodeBody(Buffer.from(buffer), encoding).toString("utf8");
          }),
      );
    }
  });

  // Monkey patches the `crypto.randomBytes` method to log generated random bytes in hexadecimal format in order to deterministically replay them in unit tests.
  const randomBytesOutputs: string[] = [];
  const originalRandomBytes = crypto.randomBytes;
  crypto.randomBytes = (size: number) => {
    const bytes = originalRandomBytes.call(crypto, size);
    randomBytesOutputs.push(crypto.to_hex(bytes));
    return bytes;
  };

  // Monkey patches the `crypto.randomKeypair` method to log generated random keypairs in hexadecimal format in order to deterministically replay them in unit tests.
  const randomKeypairOutputs: string[] = [];
  const originalRandomKeypair = crypto.randomKeypair;
  crypto.randomKeypair = () => {
    const keypair = originalRandomKeypair.call(crypto);
    randomKeypairOutputs.push(crypto.to_hex(keypair.privateKey));
    return keypair;
  };

  let { device, sub } = await createDeviceWithSeed(seed);
  const withDevice: WithDevice = () => fn => fn(device.transport);
  const options: ScenarioOptions = {
    withDevice,
    sdkForName: (name, opts) =>
      getSdk(
        !!getEnv("MOCK"),
        {
          applicationId: opts?.applicationId ?? 16,
          name,
          apiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
        },
        withDevice,
      ),
    pauseRecorder: async (milliseconds: number) => {
      await new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    switchDeviceSeed: async (newSeed?: string) => {
      // release and replace previous device
      await releaseSpeculosDevice(device.id);
      const res = await createDeviceWithSeed(newSeed || genSeed());
      device = res.device;
      sub = res.sub;
      return device;
    },
  };

  // Run the scenario with speculos simulator and with all networking recorded.
  server.listen({ onUnhandledRequest: "bypass" });
  try {
    await scenario(device.id, options);
  } finally {
    sub.unsubscribe();
    await Promise.all(buttonClicksPromises);
    await releaseSpeculosDevice(device.id);
    server.close();
  }

  // Ensure every request/response body has been captured before serializing.
  await Promise.all(bodyReads);

  if (file) {
    const json = {
      apdus: recordStore.toString(),
      crypto: { randomBytesOutputs, randomKeypairOutputs },
      http: { transactions },
    };
    await fsPromises.writeFile(file, JSON.stringify(json, null, 2));
  }
}

// Speculos runs locally over HTTP (localhost or 127.0.0.1, on a random port).
// Only trustchain backend traffic is kept in the snapshot, the device APDU
// exchanges are replayed from the recorded APDU store instead.
function isSpeculosRequest(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

// Headers invalidated by storing the decoded response body in the snapshot.
const DECODED_BODY_HEADERS = new Set(["content-encoding", "content-length"]);

function decodeBody(buffer: Buffer, encoding?: string): Buffer {
  switch (encoding) {
    case "gzip":
      return zlib.gunzipSync(buffer);
    case "br":
      return zlib.brotliDecompressSync(buffer);
    case "deflate":
      return zlib.inflateSync(buffer);
    default:
      return buffer;
  }
}

function headersToJson(headers, exclude?: Set<string>) {
  const obj: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    if (exclude?.has(key.toLowerCase())) continue;
    obj[key] = value;
  }
  return obj;
}

type Transaction = {
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
};
