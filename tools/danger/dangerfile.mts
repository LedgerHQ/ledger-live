import validateCommits from "./validation/commits.ts";
import validateDependencyChecks from "./validation/dependency-checks.ts";
import validateNodeModulesSize from "./validation/node-modules-size.ts";
import validatePrTitle from "./validation/pr-title.ts";

schedule(validatePrTitle);
schedule(validateCommits);
schedule(validateNodeModulesSize);
schedule(validateDependencyChecks);
