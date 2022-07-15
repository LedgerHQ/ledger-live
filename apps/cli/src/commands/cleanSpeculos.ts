/* eslint-disable no-console */
import { execSync } from "child_process";
import { of } from "rxjs";
export default {
  description: "clean all docker instance of speculos",
  args: [],
  job: () => {
    const instances = execSync("docker ps -a -q --filter name=speculos")
      .toString()
      .split(/\s/g)
      .filter(Boolean);

    if (instances.length > 0) {
      execSync("docker container rm -f " + instances.join(" "));
    }

    return of(instances.join(" "));
  },
};
