import { setEnv } from "@ledgerhq/live-env";
import { startSpeculos, specs, stopSpeculos } from "@ledgerhq/live-common/e2e/speculos";
import invariant from "invariant";

const BASE_PORT = 30000;
const MAX_PORT = 65535;
let portCounter = BASE_PORT;

export async function launchSpeculos(appName: string, testTitle?: string) {
  if (portCounter > MAX_PORT) {
    portCounter = BASE_PORT;
  }

  const speculosPort = portCounter++;

  if (testTitle) {
    testTitle = testTitle.replace(/ /g, "_");
  }

  setEnv(
    "SPECULOS_PID_OFFSET",
    (speculosPort - BASE_PORT) * 1000 + parseInt(process.env.TEST_WORKER_INDEX || "0") * 100,
  );

  const device = await startSpeculos(
    testTitle ?? "cli_speculos",
    specs[appName.replace(/ /g, "_")],
  );

  invariant(device, "[E2E Setup] Speculos not started");
  setEnv("SPECULOS_API_PORT", device.port);
  process.env.SPECULOS_API_PORT = device.port.toString();

  console.warn(`Speculos ${device.id} started on ${device.port}`);
  return device;
}

export async function killSpeculos(deviceId: string) {
  await stopSpeculos(deviceId);
}
