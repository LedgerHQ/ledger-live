import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import Transport from "@ledgerhq/hw-transport";
import { log } from "@ledgerhq/logs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { HttpSpeculosDatasource } from "@ledgerhq/device-transport-kit-speculos";
import {
  type ButtonKey,
  deviceControllerClientFactory,
} from "@ledgerhq/speculos-device-controller";
import { Observable, share } from "rxjs";

/**
 * Minimal Speculos harness for the LKRP recorder.
 *
 * The recorder needs three things from a Speculos container: exchange APDUs,
 * press buttons and observe the automation event stream. All three are covered
 * by the two published DMK packages imported above, so this file deliberately
 * avoids `@ledgerhq/speculos-transport` and `@ledgerhq/live-dmk-speculos`: both
 * are private to this monorepo, and the latter carries a DMK session cache,
 * device discovery and reconnect logic that only the Live apps need.
 *
 * Keeping it here means the LKRP packages depend on published code only, which
 * is what lets them move out of this repo. It is test-only: `tsconfig.build.json`
 * excludes `tests/`, and only `pnpm e2e` (Docker + COIN_APPS) reaches it.
 */

/** Directory name used under `coinapps`, per the coin-apps repository layout. */
const APP_DIR_BY_MODEL: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoS]: "nanos",
  [DeviceModelId.nanoSP]: "nanos+",
  [DeviceModelId.nanoX]: "nanox",
  [DeviceModelId.stax]: "stax",
  [DeviceModelId.europa]: "flex",
};

/** Value expected by the Speculos `--model` flag. */
const SPECULOS_MODEL: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.nanoS]: "nanos",
  [DeviceModelId.nanoSP]: "nanosp",
  [DeviceModelId.nanoX]: "nanox",
  [DeviceModelId.stax]: "stax",
  [DeviceModelId.europa]: "flex",
};

const DEFAULT_IMAGE = "ghcr.io/ledgerhq/speculos:sha-e262a0c";

/** Generous enough to cover a cold `docker run` that first pulls the image. */
const BOOT_TIMEOUT_MS = 180_000;

const DOCKER_PATHS = ["/usr/local/bin/docker", "/usr/bin/docker", "/opt/homebrew/bin/docker"];

/** Resolving plain `docker` through `PATH` lets a writable PATH entry shadow the binary. */
function dockerBin(): string {
  const bin = DOCKER_PATHS.find(existsSync);
  if (!bin) throw new Error(`Docker CLI not found in ${DOCKER_PATHS.join(", ")}`);
  return bin;
}

export type SpeculosDeviceParams = {
  model: DeviceModelId;
  firmware: string;
  appName: string;
  appVersion: string;
  seed: string;
  /** Root folder holding the app binaries (a clone of LedgerHQ/coin-apps). */
  coinapps: string;
};

export type SpeculosDevice = {
  id: string;
  transport: SpeculosApduTransport;
};

/**
 * A `@ledgerhq/hw-transport` over the Speculos REST API.
 *
 * Only `exchange` is implemented: the base class builds `send` on top of it,
 * which is all `@ledgerhq/hw-ledger-key-ring-protocol`'s ApduDevice uses.
 */
export class SpeculosApduTransport extends Transport {
  private readonly datasource: HttpSpeculosDatasource;
  private buttons: ReturnType<
    ReturnType<typeof deviceControllerClientFactory>["buttonFactory"]
  > | null = null;

  /**
   * Speculos automation events. Lazy: the SSE stream opens on first
   * subscription and is torn down when the last subscriber leaves.
   */
  readonly automationEvents: Observable<Record<string, unknown>>;

  constructor(private readonly baseUrl: string) {
    super();
    this.datasource = new HttpSpeculosDatasource(baseUrl);
    this.automationEvents = this.createAutomationEvents$();
  }

  private createAutomationEvents$(): Observable<Record<string, unknown>> {
    return new Observable<Record<string, unknown>>(observer => {
      let stream: { cancel?: () => Promise<void> } | null = null;
      let unsubscribed = false;

      this.datasource
        .openEventStream(
          event => observer.next(event),
          () => observer.complete(),
        )
        .then(opened => {
          if (unsubscribed) {
            opened.cancel?.().catch(() => {});
          } else {
            stream = opened;
          }
        })
        .catch(error => {
          log("speculos-event", `SSE connection error: ${String(error)}`);
          observer.error(error);
        });

      return () => {
        unsubscribed = true;
        stream?.cancel?.().catch(() => {});
      };
    }).pipe(share({ resetOnRefCountZero: true }));
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const request = apdu.toString("hex");
    log("apdu", "=> " + request);
    const response = await this.datasource.postApdu(request);
    log("apdu", "<= " + response);
    return Buffer.from(response, "hex");
  }

  async button(key: ButtonKey): Promise<void> {
    if (!this.buttons) {
      this.buttons = deviceControllerClientFactory(this.baseUrl).buttonFactory();
    }
    log("speculos-button", "press-and-release", key);
    return this.buttons.press(key);
  }

  async close(): Promise<void> {
    this.buttons = null;
  }
}

const devices: Record<
  string,
  { process: ChildProcessWithoutNullStreams; destroy: () => Promise<void> }
> = {};

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

async function getAvailablePort(): Promise<number> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const port = randomInt(61000, 65536);
    if (await isPortAvailable(port)) return port;
  }
  throw new Error("Failed to find an available port for Speculos after 10 attempts");
}

function appSubpath({ model, firmware, appName, appVersion }: SpeculosDeviceParams): string {
  const dir = APP_DIR_BY_MODEL[model];
  if (!dir) throw new Error(`Unsupported Speculos device model: ${model}`);
  return `${dir}/${firmware}/${appName.replaceAll(" ", "")}/app_${appVersion}.elf`;
}

/** Boots a Speculos container running `appName` and connects a transport to it. */
export async function createSpeculosDevice(params: SpeculosDeviceParams): Promise<SpeculosDevice> {
  const { model, seed, coinapps } = params;
  const speculosModel = SPECULOS_MODEL[model];
  if (!speculosModel) throw new Error(`Unsupported Speculos device model: ${model}`);

  const id = `speculosID-${randomUUID()}`;
  const docker = dockerBin();
  const apiPort = await getAvailablePort();

  const args = [
    "run",
    "-v",
    `${coinapps}:/speculos/apps:ro`,
    "-p",
    `${apiPort}:40000`,
    "--name",
    id,
    process.env.SPECULOS_IMAGE_TAG ?? DEFAULT_IMAGE,
    "--model",
    speculosModel,
    `./apps/${appSubpath(params)}`,
    "--display",
    "headless",
    "--api-port",
    "40000",
    "--seed",
    seed,
  ];

  const loggedArgs = args.map((arg, i) => (args[i - 1] === "--seed" ? "<redacted>" : arg));
  log("speculos", `${id}: spawning = ${loggedArgs.join(" ")}`);
  const child = spawn(docker, args);

  let stdout = "";
  let stderr = "";
  let destroyed = false;

  const destroy = () =>
    new Promise<void>((resolve, reject) => {
      if (destroyed) return resolve();
      destroyed = true;
      delete devices[id];
      const rm = spawn(docker, ["rm", "-f", id]);
      const fail = (error: Error) => {
        log("speculos-error", `${id} not destroyed: ${String(error)}`);
        reject(error);
      };
      rm.on("error", fail);
      rm.on("close", code => {
        if (code !== 0) {
          fail(new Error(`docker rm -f ${id} exited with code ${String(code)}`));
        } else {
          log("speculos", `destroyed ${id}`);
          resolve();
        }
      });
    });

  const ready = new Promise<void>((resolve, reject) => {
    const done = () => {
      clearTimeout(bootTimer);
      resolve();
    };

    const fail = (message: string) => {
      clearTimeout(bootTimer);
      const extra = [stdout && `--- stdout ---\n${stdout}`, stderr && `--- stderr ---\n${stderr}`]
        .filter(Boolean)
        .join("\n");
      reject(new Error(extra ? `${message}\n\n${extra}` : message));
    };

    const bootTimer = setTimeout(() => {
      destroy().catch(() => {});
      fail(`Speculos did not become ready within ${BOOT_TIMEOUT_MS}ms`);
    }, BOOT_TIMEOUT_MS);

    child.on("error", error => fail(`Speculos could not be spawned: ${String(error)}`));

    child.stdout.on("data", data => {
      const text = String(data).trim();
      if (!text) return;
      stdout += (stdout ? "\n" : "") + text;
      log("speculos-stdout", `${id}: ${text}`);
    });

    child.stderr.on("data", data => {
      const text = String(data).trim();
      if (!text) return;
      stderr += (stderr ? "\n" : "") + text;
      if (!text.includes("apdu: ")) log("speculos-stderr", `${id}: ${text}`);

      // Speculos logs this once the emulator is up and listening.
      if (/using\s(?:SDK|API_LEVEL)/.test(text)) {
        setTimeout(done, 500);
      } else if (text.includes("is already in use by") || text.includes("address already in use")) {
        fail("Speculos could not start: the container name or port is already in use");
      }
    });

    child.on("close", async () => {
      log("speculos", `${id} closed`);
      if (!destroyed) {
        await destroy().catch(() => {});
        fail("Speculos process exited unexpectedly");
      }
    });
  });

  await ready;

  devices[id] = { process: child, destroy };

  return { id, transport: new SpeculosApduTransport(`http://127.0.0.1:${apiPort}`) };
}

/** Stops and removes a device created by {@link createSpeculosDevice}. */
export async function releaseSpeculosDevice(id: string): Promise<void> {
  log("speculos", "release " + id);
  await devices[id]?.destroy();
}
