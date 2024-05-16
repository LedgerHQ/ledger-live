import Docker from "dockerode";

const delay = (timing: number) => new Promise(resolve => setTimeout(resolve, timing));
import chalk from "chalk";

const docker = new Docker();
const containerName = "zombienet";

export async function spawnZombienet() {
  console.log("Starting Zombienet...");

  const container = await docker.createContainer({
    Image: "coin-tester-zombienet:latest",
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

  async function checkZombienetLogs(has_started_max_retry = 5) {
    if (has_started_max_retry === 0) {
      throw new Error("Zombienet failed to start. Check possible logs");
    }

    const logs = (await container.logs({ stdout: true })).toString();

    if (logs.includes("Network launched")) {
      console.log(chalk.bgBlueBright(" -  ZOMBIENET READY ✅  - "));
      return;
    }

    console.log("Waiting for zombienet to start...");
    await delay(3 * 1000); // 3 seconds

    return checkZombienetLogs(has_started_max_retry - 1);
  }

  await checkZombienetLogs();
}

export async function killZombienet() {
  const containers = await docker.listContainers();

  for (const container of containers) {
    console.log(container.Names);
    if (container.Names.some(name => name.includes(containerName))) {
      console.log("Killing zombienet...");
      const zombienetContainer = docker.getContainer(container.Id);
      await zombienetContainer.stop();
      await zombienetContainer.remove();
    }
  }
}
