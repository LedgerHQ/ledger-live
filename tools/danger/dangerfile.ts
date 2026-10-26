import validateCommits from "./validation/commits";
import validateDependencyChecks from "./validation/dependency-checks";
import validateLockfileResolution from "./validation/lockfile-resolution";
import validateNodeModulesSize from "./validation/node-modules-size";
import validatePrTitle from "./validation/pr-title";

schedule(validatePrTitle);
schedule(validateCommits);
schedule(validateNodeModulesSize);
schedule(validateDependencyChecks);
schedule(validateLockfileResolution);
