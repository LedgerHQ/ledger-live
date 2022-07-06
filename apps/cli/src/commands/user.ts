import { of, concat } from "rxjs";
import { getUserHashes } from "@ledgerhq/live-common/user";
export default {
  args: [],
  job: () => concat(of(JSON.stringify(getUserHashes()))),
};
