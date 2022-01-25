import { from } from "rxjs";
import { map } from "rxjs/operators";
import {
  getEnvDesc,
  getEnv,
  getAllEnvNames,
} from "@ledgerhq/live-common/lib/env";
export default {
  description: "Print available environment variables",
  args: [],
  job: () =>
    from(getAllEnvNames()).pipe(
      map(
        (name) =>
          `# ${name} ${getEnvDesc(name)}\n${name}=${JSON.stringify(
            getEnv(name)
          )}\n`
      )
    ),
};
