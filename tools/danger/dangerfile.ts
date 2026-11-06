import validateCommits from "./validation/commits";
import validateDependencyChecks from "./validation/dependency-checks";
import validateLegacyScore from "./validation/legacy-score";
import validateNodeModulesSize from "./validation/node-modules-size";
import validatePrTitle from "./validation/pr-title";

schedule(validatePrTitle);
schedule(validateCommits);
schedule(validateNodeModulesSize);
schedule(validateDependencyChecks);
schedule(validateLegacyScore);
