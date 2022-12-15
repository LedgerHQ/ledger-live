import { Probot } from "probot";
import { upToDate } from "./features/upToDate";
import { orchestrator } from "./features/orchestrator";
import { autoClose } from "./features/autoClose";
import { generateScreenshots } from "./commands/genarate-screenshots";
import { regenPods } from "./commands/regen-pods";

export default (app: Probot) => {
  /* Commands */

  // /generate-screenshots command
  generateScreenshots(app);
  // /regen-pods command
  regenPods(app);

  /* PR stuff */

  // trigger to autoclose PR when not respecting guidelines
  autoClose(app);

  /* CI stuff */

  // Report if PRs are up to date
  upToDate(app);
  // Orchestrate
  orchestrator(app);
};
