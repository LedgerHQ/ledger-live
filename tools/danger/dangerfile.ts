import validateCommits from "./validation/commits";
import validatePrTitle from "./validation/pr-title";

schedule(validatePrTitle);
schedule(validateCommits);
