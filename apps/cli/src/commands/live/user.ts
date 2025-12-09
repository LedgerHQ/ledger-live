import { of, concat } from "rxjs";
import { getUserHashes } from "@ledgerhq/live-common/user";
export default {
  args: [
    {
      name: "userId",
      desc: "User ID to compute hashes for",
      type: String,
    },
  ],
  job: ({ userId }: { userId?: string }) => {
    if (!userId) {
      throw new Error(
        "userId argument is required. USER_ID environment variable is no longer supported. Please provide userId as an argument.",
      );
    }
    return concat(of(JSON.stringify(getUserHashes(userId))));
  },
};
