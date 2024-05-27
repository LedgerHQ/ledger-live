import path from "path";
import axios from "axios";
import fs from "fs/promises";
import { v2 as compose } from "docker-compose";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import { ENV } from "../types";
import chalk from "chalk";
import { SignOperationEvent } from "@ledgerhq/types-live";

const { API_PORT } = process.env as ENV;
const cwd = path.join(__dirname);

const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));

const ensureEnv = () => {
  const mandatory_env_variables = ["SEED", "API_PORT", "GH_TOKEN"];
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
};

export const spawnSpeculos = async (
  nanoAppEndpoint: `/${string}`,
): Promise<{
  transport: SpeculosTransportHttp;
  onSignerConfirmation: (e?: SignOperationEvent) => Promise<void>;
}> => {
  ensureEnv();
  console.log(`Starting speculos...`);

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

  await compose.upOne("speculos", {
    cwd,
    log: true,
    env: process.env,
  });

  const checkSpeculosLogs = async (): Promise<SpeculosTransportHttp> => {
    const { out } = await compose.logs("speculos", { cwd, env: process.env });

    if (out.includes("Running on all addresses (0.0.0.0)")) {
      console.log(chalk.bgYellowBright.black(" -  SPECULOS READY ✅  - "));
      return SpeculosTransportHttp.open({
        apiPort: API_PORT,
      });
    }

    await delay(200);
    return checkSpeculosLogs();
  };

  const onSpeculosConfirmation = async (e?: SignOperationEvent): Promise<void> => {
    if (e?.type === "device-signature-requested") {
      const { data } = await axios.get(
        `http://localhost:${process.env.API_PORT}/events?currentscreenonly=true`,
      );

      if (data.events[0].text !== "Accept") {
        await axios.post(`http://localhost:${process.env.API_PORT}/button/right`, {
          action: "press-and-release",
        });
        onSpeculosConfirmation(e);
      } else {
        await axios.post(`http://localhost:${process.env.API_PORT}/button/both`, {
          action: "press-and-release",
        });
      }
    }
  };

  return checkSpeculosLogs().then(transport => {
    return {
      transport,
      onSignerConfirmation: onSpeculosConfirmation,
    };
  });
};

export const killSpeculos = async () => {
  console.log("Stopping speculos...");
  await compose.down({
    cwd,
    log: true,
    env: process.env,
  });
};

["exit", "SIGINT", "SIGQUIT", "SIGTERM", "SIGUSR1", "SIGUSR2", "uncaughtException"].map(e =>
  process.on(e, async () => {
    await killSpeculos();
  }),
);
