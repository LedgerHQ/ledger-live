import path from "path";
import chalk from "chalk";
import fs from "fs/promises";
import * as compose from "docker-compose";
import axios, { AxiosError } from "axios";
import { SignOperationEvent } from "@ledgerhq/types-live";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import { ENV } from "../types";

const { SPECULOS_API_PORT } = process.env as ENV;
const cwd = path.join(__dirname);

const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));

function ensureEnv() {
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

export async function spawnSpeculos(nanoAppEndpoint: `/${string}`): Promise<{
  transport: SpeculosTransportHttp;
  getOnSpeculosConfirmation: (approvalText?: string) => () => Promise<void>;
}> {
  ensureEnv();
  console.log(`Starting speculos...`);

  try {
    const { data: blob } = await axios({
      url: `https://raw.githubusercontent.com/LedgerHQ/coin-apps/master/nanox${nanoAppEndpoint}`,
      method: "GET",
      responseType: "stream",
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
      },
    });

    await fs.mkdir(path.resolve(cwd, "tmp"), { recursive: true });
    await fs.writeFile(path.resolve(cwd, "tmp/app.elf"), blob, "binary");
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
    env: process.env,
  });

  async function checkSpeculosLogs(): Promise<SpeculosTransportHttp> {
    const { out } = await compose.logs("speculos", { cwd, env: process.env });

    if (out.includes("Running on all addresses (0.0.0.0)")) {
      console.log(chalk.bgYellowBright.black(" -  SPECULOS READY ✅  - "));
      return SpeculosTransportHttp.open({
        apiPort: SPECULOS_API_PORT,
      });
    }

    await delay(200);
    return checkSpeculosLogs();
  }

  function getOnSpeculosConfirmation(approvalText = "Accept") {
    async function onSpeculosConfirmation(e?: SignOperationEvent): Promise<void> {
      if (e?.type === "device-signature-requested") {
        const { data } = await axios.get(
          `http://localhost:${SPECULOS_API_PORT}/events?currentscreenonly=true`,
        );

        if (data.events[0].text !== approvalText) {
          await axios.post(`http://localhost:${SPECULOS_API_PORT}/button/right`, {
            action: "press-and-release",
          });

          onSpeculosConfirmation(e);
        } else {
          await axios.post(`http://localhost:${SPECULOS_API_PORT}/button/both`, {
            action: "press-and-release",
          });
        }
      }
    }

    return onSpeculosConfirmation;
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
  });
}

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killSpeculos();
  }),
);
