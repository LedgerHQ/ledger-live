import path from "path";
import chalk from "chalk";
import fs from "fs/promises";
import * as compose from "docker-compose";
import axios, { AxiosError } from "axios";
import { SignOperationEvent } from "@ledgerhq/types-live";
import { DeviceManagementKitTransportSpeculos } from "@ledgerhq/live-dmk-speculos";
import { deviceControllerClientFactory } from "@ledgerhq/speculos-device-controller";
import { ENV } from "../types";

const { SPECULOS_API_PORT } = process.env as ENV;
const cwd = path.join(__dirname);

export const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));

export function ensureEnv() {
  const mandatory_env_variables = ["SEED", "SPECULOS_API_PORT", "GH_TOKEN"];
  const optional_env_variables = ["SPECULOS_IMAGE"];

  if (!mandatory_env_variables.every(variable => !!process.env[variable])) {
    throw new Error(
      `Missing env variables. Make sure that ${mandatory_env_variables.join(",")} are in your .env`,
    );
  }

  optional_env_variables.forEach(envVariable => {
    if (!process.env[envVariable]) {
      console.warn(`Variable ${envVariable} missing from .env. Using default value.`);
    }
  });
}

async function downloadApp(nanoAppEndpoint: `/${string}`) {
  const { data: blob } = await axios({
    url: `https://raw.githubusercontent.com/LedgerHQ/coin-apps/master/nanox${nanoAppEndpoint}`,
    method: "GET",
    responseType: "stream",
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
    },
  });

  return blob;
}

export async function spawnSpeculos(
  nanoAppEndpoint: `/${string}`,
  options?: {
    libraries?: Array<{ name: string; endpoint: `/${string}` }>;
  },
): Promise<{
  transport: DeviceManagementKitTransportSpeculos;
  getOnSpeculosConfirmation: (approvalText?: string) => () => Promise<void>;
}> {
  ensureEnv();
  console.log(`Starting speculos...`);

  const libraryArgs: string[] = [];
  try {
    const blob = await downloadApp(nanoAppEndpoint);

    await fs.mkdir(path.resolve(cwd, "tmp"), { recursive: true });
    await fs.writeFile(path.resolve(cwd, "tmp/app.elf"), blob, "binary");

    if (options?.libraries) {
      for (const library of options.libraries) {
        const libBlob = await downloadApp(library.endpoint);

        const libFileName = `${library.name.toLowerCase()}.elf`;
        await fs.writeFile(path.resolve(cwd, "tmp", libFileName), libBlob, "binary");
        libraryArgs.push(`-l ${library.name}:./apps/${libFileName}`);
      }
    }
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new Error(
        `${err.status}: Failed to download the app.elf file from ${nanoAppEndpoint}\nMake sure that your GH_TOKEN is correct and has the right permissions.`,
      );
    }

    throw err;
  }

  await compose.upOne("speculos", {
    cwd,
    log: Boolean(process.env.DEBUG),
    env: {
      ...process.env,
      SPECULOS_EXTRA_ARGS: libraryArgs.join(" "),
    },
  });

  async function checkSpeculosLogs(): Promise<DeviceManagementKitTransportSpeculos> {
    const { out } = await compose.logs("speculos", { cwd, env: process.env });

    if (out.includes("Server started")) {
      console.log(chalk.bgYellowBright.black(" -  SPECULOS READY ✅  - "));
      return DeviceManagementKitTransportSpeculos.open({
        apiPort: SPECULOS_API_PORT,
      });
    }

    await delay(200);
    return checkSpeculosLogs();
  }

  function getOnSpeculosConfirmation(approvalText = "Accept") {
    return async function onSpeculosConfirmation(e?: SignOperationEvent): Promise<void> {
      if (e?.type !== "device-signature-requested") return;

      const baseURL = `http://127.0.0.1:${SPECULOS_API_PORT}`;
      const buttonClient = deviceControllerClientFactory(baseURL).buttonFactory();

      const maxAttempts = 80;
      const delayMs = 250;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { data } = await axios.get(`${baseURL}/events?currentscreenonly=true`, {
            timeout: 2000,
          });

          const text = data?.events?.[0]?.text;
          if (text === approvalText) {
            await buttonClient.both();
            return;
          }

          // not on the approval screen yet—scroll right and retry
          await buttonClient.right();
        } catch (err) {
          // retry on network issues
          if (axios.isAxiosError(err)) {
            // fall through to retry
          } else {
            throw err;
          }
        }

        await delay(delayMs);
      }

      throw new Error(`Speculos confirmation not reached after ${maxAttempts} attempts`);
    };
  }

  return checkSpeculosLogs().then(transport => {
    return {
      transport,
      getOnSpeculosConfirmation,
    };
  });
}

export async function killSpeculos() {
  console.log("Stopping speculos...");
  await compose.down({
    cwd,
    log: Boolean(process.env.DEBUG),
    env: process.env,
    commandOptions: ["--remove-orphans"],
  });
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killSpeculos();
  }),
);
