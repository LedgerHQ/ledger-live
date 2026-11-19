import { rm, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const USAGE = [
  "Usage: pnpm e2e-cli speculos start --app <spec> --suite <suite> --catalog <file> --out <file>",
  "       pnpm e2e-cli speculos stop --id <device id>",
].join("\n");

/** A started Speculos, for a program that drives an app against it from another process. */
export interface SpeculosSession {
  id: string;
  /** What the mobile app's `addKnownSpeculos` bridge message takes. */
  address: string;
  model: string;
  sessionToken?: string;
}

export type SpeculosCommand =
  | { action: "start"; app: string; suite: string; catalog: string; out: string }
  | { action: "stop"; id: string };

export function parseSpeculosArgs(argv: string[]): SpeculosCommand {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      app: { type: "string" },
      suite: { type: "string" },
      catalog: { type: "string" },
      out: { type: "string" },
      id: { type: "string" },
    },
  });
  const [action] = positionals;
  const { app, suite, catalog, out, id } = values;
  if (action === "start" && app && suite && catalog && out) {
    return { action, app, suite, catalog, out };
  }
  if (action === "stop" && id) return { action, id };
  throw new Error(USAGE);
}

function withoutTrailingSlashes(url: string): string {
  let end = url.length;
  while (url.endsWith("/", end)) end--;
  return url.slice(0, end);
}

/** The address a device registers Speculos under, as e2e/mobile's `registerKnownSpeculos` sends it. */
export function knownSpeculosAddress(configured: string | undefined, port: number): string {
  const address = configured?.trim();
  if (!address) return `http://127.0.0.1:${port}`;
  const withScheme = withoutTrailingSlashes(
    address.startsWith("http") ? address : `http://${address}`,
  );
  return /:\d+$/.test(withScheme) ? withScheme : `${withScheme}:${port}`;
}

async function start({
  app,
  suite,
  catalog,
  out,
}: Extract<SpeculosCommand, { action: "start" }>): Promise<void> {
  const { specs, startSpeculos, stopSpeculos } = await import("../speculos.js");
  const { createNanoAppJsonFile, getSpeculosModel } = await import("../speculosAppVersion.js");
  const { waitForSpeculosReady } = await import("../speculosCI.js");

  const spec = specs[app];
  if (!spec) throw new Error(`No Speculos spec for "${app}"`);
  await createNanoAppJsonFile(catalog);

  const device = await startSpeculos(`e2e-cli-${app}`, spec, {
    suite,
    nanoAppCatalogPath: catalog,
  });
  if (!device) throw new Error(`Speculos did not start for ${app}`);
  try {
    if (process.env.REMOTE_SPECULOS === "true") await waitForSpeculosReady(device.id);
    const session: SpeculosSession = {
      id: device.id,
      address: knownSpeculosAddress(process.env.SPECULOS_ADDRESS, device.port),
      model: getSpeculosModel(),
      ...(process.env.SPECULOS_SESSION_TOKEN
        ? { sessionToken: process.env.SPECULOS_SESSION_TOKEN }
        : {}),
    };
    await rm(out, { force: true });
    await writeFile(out, JSON.stringify(session), { mode: 0o600 });
  } catch (error) {
    await stopSpeculos(device.id);
    throw error;
  }
  console.log(`Speculos ${device.id} is ready: ${app} ${device.appVersion}`);
}

async function stop({ id }: Extract<SpeculosCommand, { action: "stop" }>): Promise<void> {
  const { stopSpeculos } = await import("../speculos.js");
  if (!(await stopSpeculos(id))) throw new Error(`Speculos ${id} was not released`);
  console.log(`Speculos ${id} released`);
}

/** Starts a Speculos for one app and writes its {@link SpeculosSession} to a file, or stops one. */
export async function runSpeculosCommand(argv: string[]): Promise<void> {
  const command = parseSpeculosArgs(argv);
  if (command.action === "start") await start(command);
  else await stop(command);
}
