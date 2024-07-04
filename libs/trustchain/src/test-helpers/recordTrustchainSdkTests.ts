import fsPromises from "fs/promises";
import { setupServer } from "msw/node";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import { createSpeculosDevice, releaseSpeculosDevice } from "@ledgerhq/speculos-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";
import Transport from "@ledgerhq/hw-transport";
import { crypto } from "@ledgerhq/hw-trustchain";
import { setEnv } from "@ledgerhq/live-env";
import { RecorderConfig, ScenarioOptions, genSeed, recorderConfigDefaults } from "./types";

setEnv("GET_CALLS_RETRY", 0);

export async function recordTestTrustchainSdk(
  file: string | null,
  scenario: (transport: Transport, scenarioOptions: ScenarioOptions) => Promise<void>,
  config: RecorderConfig,
) {
  const seed = config.seed || genSeed();
  const coinapps = config.coinapps;
  if (!coinapps) throw new Error("coinapps is required"); // it's completed by e2e script
  const overridesAppPath = config.overridesAppPath;
  const goNextOnText = config.goNextOnText || recorderConfigDefaults.goNextOnText;
  const approveOnText = config.approveOnText || recorderConfigDefaults.approveOnText;

  const recordStore = new RecordStore();

  const createDeviceWithSeed = async (seed: string) => {
    const device = await createSpeculosDevice({
      model: DeviceModelId.nanoSP,
      firmware: "2.1.0",
      appName: "Ledger Sync",
      appVersion: "0.0.1",
      seed,
      coinapps, // folder where there is the Ledger Sync coin app
      overridesAppPath,
    });

    // passthrough all success cases for the Ledger Sync coin app to accept all.
    device.transport.automationEvents.subscribe(event => {
      if (goNextOnText.some(t => event.text.includes(t))) {
        device.transport.button("right");
      } else if (approveOnText.some(t => event.text.includes(t))) {
        device.transport.button("both");
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

    return device;
  };

  // listen to network with msw to be able to replay in our future tests
  const transactions: Transaction[] = [];
  const server = setupServer();
  server.events.on("response:bypass", ({ response, request }) => {
    if (request.url.startsWith("http://localhost")) return; // ignore speculos requests
    const transaction: Transaction = {
      request: {
        url: request.url,
        method: request.method,
        headers: headersToJson(request.headers),
      },
      response: {
        status: response.status,
        headers: headersToJson(response.headers),
      },
    };
    transactions.push(transaction);
    if (request.body) {
      request.text().then(body => {
        transaction.request.body = body;
      });
    }
    if (response.body) {
      response.text().then(body => {
        transaction.response.body = body;
      });
    }
  });

  // Monkey patches the `crypto.randomBytes` method to log generated random bytes in hexadecimal format in order to deterministically replay them in unit tests.
  const randomBytesOutputs: string[] = [];
  const originalRandomBytes = crypto.randomBytes;
  crypto.randomBytes = async (size: number) => {
    const bytes = await originalRandomBytes.call(crypto, size);
    randomBytesOutputs.push(crypto.to_hex(bytes));
    return bytes;
  };

  // Monkey patches the `crypto.randomKeypair` method to log generated random keypairs in hexadecimal format in order to deterministically replay them in unit tests.
  const randomKeypairOutputs: string[] = [];
  const originalRandomKeypair = crypto.randomKeypair;
  crypto.randomKeypair = async () => {
    const keypair = await originalRandomKeypair.call(crypto);
    randomKeypairOutputs.push(crypto.to_hex(keypair.privateKey));
    return keypair;
  };

  let device = await createDeviceWithSeed(seed);
  const options: ScenarioOptions = {
    pauseRecorder: async (milliseconds: number) => {
      await new Promise(resolve => setTimeout(resolve, milliseconds));
    },
    switchDeviceSeed: async (newSeed?: string) => {
      // release and replace previous device
      await releaseSpeculosDevice(device.id);
      device = await createDeviceWithSeed(newSeed || genSeed());
      return device.transport;
    },
  };

  // Run the scenario with speculos simulator and with all networking recorded.
  server.listen({ onUnhandledRequest: "bypass" });
  try {
    await scenario(device.transport, options);
  } finally {
    await releaseSpeculosDevice(device.id);
  }
  server.close();

  if (file) {
    const json = {
      apdus: recordStore.toString(),
      crypto: { randomBytesOutputs, randomKeypairOutputs },
      http: { transactions },
    };

    // Write the transactions to the disk.
    await fsPromises.writeFile(file, JSON.stringify(json, null, 2));
  }
}

function headersToJson(headers) {
  const obj: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
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
