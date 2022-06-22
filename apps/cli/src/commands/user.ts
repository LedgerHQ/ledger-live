import { of, concat } from "rxjs";
import { getUserHashes } from "@ledgerhq/live-common/lib/user";
export default {
  args: [],
  job: () => concat(of(JSON.stringify(getUserHashes()))),
};
