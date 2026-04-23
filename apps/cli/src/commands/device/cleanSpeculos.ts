import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync } from "fs";
import { of } from "rxjs";

/** Preferred absolute paths to docker (used before falling back to PATH lookup). */
const DOCKER_CANDIDATES = ["/usr/bin/docker", "/usr/local/bin/docker"] as const;
/** Empty DOCKER_PATH should fall through to candidates / "docker", not be passed to execFileSync. */
const DOCKER_FROM_ENV = process.env.DOCKER_PATH?.trim() || undefined;
const DOCKER_PATH =
  DOCKER_FROM_ENV ??
  DOCKER_CANDIDATES.find(p => {
    try {
      if (existsSync(p)) {
        accessSync(p, constants.X_OK);
        return true;
      }
    } catch {
      // not found or not executable
    }
    return false;
  }) ??
  "docker";

export default {
  description: "clean all docker instance of speculos",
  args: [],
  job: () => {
    const execOpts = { encoding: "utf8" as const };
    const out = execFileSync(
      DOCKER_PATH,
      ["ps", "-a", "-q", "--filter", "name=speculos"],
      execOpts,
    );
    const instances = out.split(/\s/g).filter(Boolean);

    if (instances.length > 0) {
      execFileSync(DOCKER_PATH, ["container", "rm", "-f", ...instances], execOpts);
    }

    return of(instances.join(" "));
  },
};
