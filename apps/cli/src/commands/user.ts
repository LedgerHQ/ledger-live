import { of, concat } from "rxjs";
import { getUserHashes } from "@ledgerhq/live-common/user";
import { getEnv } from "@ledgerhq/live-env";
export default {
  args: [],
  job: () => concat(of(JSON.stringify(getUserHashes(getEnv("USER_ID"))))),
};
