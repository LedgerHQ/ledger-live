import validateCommits from "./validation/commits";
import validateNodeModulesSize from "./validation/node-modules-size";
import validatePrTitle from "./validation/pr-title";

schedule(validatePrTitle);
schedule(validateCommits);
schedule(validateNodeModulesSize);
