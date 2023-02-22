import { Probot } from "probot";
import { upToDate } from "./features/upToDate";
import { orchestrator } from "./features/orchestrator";
import { autoClose } from "./features/autoClose";
import { lintCommits } from "./features/lintCommits";
import { generateScreenshots } from "./commands/generate-screenshots";
import { regenPods } from "./commands/regen-pods";
import { regenDoc } from "./commands/regen-doc";

export default (app: Probot) => {
  /* Commands */

  // /generate-screenshots command
  generateScreenshots(app);
  // /regen-pods command
  regenPods(app);
  // /regen-doc command
  regenDoc(app);

  /* PR stuff */

  // trigger to autoclose PR when not respecting guidelines
  autoClose(app);

  /* CI stuff */

  // Report if PRs are up to date
  upToDate(app);
  // Lint pull request commits
  lintCommits(app);
  // Orchestrate
  orchestrator(app);

  /* Log errors */
  app.onError((error) => {
    app.log.error("[ERROR] Unhandled error");
    app.log.error(error);
  });
};
