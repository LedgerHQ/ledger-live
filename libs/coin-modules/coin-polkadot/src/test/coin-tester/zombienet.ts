import Docker from "dockerode";

const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));
import chalk from "chalk";

const docker = new Docker();
const containerName = "zombienet";

export async function spawnZombienet() {
  console.log("Starting Zombienet...");

  const container = await docker.createContainer({
    Image: "coin-tester-zombienet",
    Tty: false,
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    name: containerName,
    ExposedPorts: {
      "31323": {},
      "3003": {},
      "1998": {},
    },
    HostConfig: {
      PortBindings: {
        "31323": [{ HostPort: "31323" }],
        "3003": [{ HostPort: "3003" }],
        "1998": [{ HostPort: "1998" }],
      },
    },
  });

  await container.start();

  async function checkZombienetLogs() {
    const logs = (await container.logs({ stdout: true })).toString();

    if (logs.includes("Network launched")) {
      console.log(chalk.bgBlueBright(" -  ZOMBIENET READY ✅  - "));
      return;
    }

    console.log("Waiting for zombienet to start...");
    await delay(3 * 1000);
    return checkZombienetLogs();
  }

  await checkZombienetLogs();
}

export async function killZombienet() {
  const containers = await docker.listContainers();

  for (const container of containers) {
    if (container.Names.some(name => name.includes(containerName))) {
      const zombienetContainer = docker.getContainer(container.Id);
      await zombienetContainer.stop();
      await zombienetContainer.remove();
    }
  }
}
