import Docker from "dockerode";

const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));
import chalk from "chalk";

const docker = new Docker();
const containerName = "chopsticks";

const ensureEnv = () => {
  // SEED passed in scenarios
  const mandatory_env_variables = ["SEED"];

  if (!mandatory_env_variables.every(variable => !!process.env[variable])) {
    throw new Error(
      `Missing env variables. Make sure that ${mandatory_env_variables.join(",")} are in your .env`,
    );
  }
};

// https://github.com/AcalaNetwork/chopsticks
export async function spawnChopsticks() {
  ensureEnv();
  console.log("Starting chopsticks...");

  const container = await docker.createContainer({
    Image: "coin-tester-chopsticks:latest",
    Tty: false,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    name: containerName,
    ExposedPorts: {
      "8000": {},
    },
    HostConfig: {
      PortBindings: {
        "8000": [{ HostPort: "8000" }],
      },
    },
  });

  await container.start();

  async function checkChopsticksLogs(has_started_max_retry = 20) {
    if (has_started_max_retry === 0) {
      throw new Error("Failed to start chopsticks container. Check possible logs.");
    }

    const logs = (await container.logs({ stdout: true })).toString();

    if (logs.includes("listening on port 8000")) {
      console.log(chalk.bgBlueBright(" -  Chopsticks READY ✅  - "));
      return;
    }

    console.log("Waiting for chopsticks to start...");
    await delay(3 * 1000); // 3 seconds

    return checkChopsticksLogs(has_started_max_retry - 1);
  }

  await checkChopsticksLogs();
}

export async function killChopsticks() {
  const containers = await docker.listContainers();

  for (const container of containers) {
    if (container.Names.some(name => name.includes(containerName))) {
      console.log("Killing chopsticks...");
      const chopsticksContainer = docker.getContainer(container.Id);
      await chopsticksContainer.stop();
      await chopsticksContainer.remove();
    }
  }
}
