import * as core from "@actions/core";
import { context } from "@actions/github";

const main = async (): Promise<void> => {
  const { ref } = context;

  const re = /refs\/pull\/(\d+)\/merge/;
  const match = re.exec(ref);

  if (match) {
    core.setOutput("pr", match[1]);
  } else {
    throw new Error("not on a Pull Request");
  }
};

main().catch((err) => core.setFailed(err.message));
