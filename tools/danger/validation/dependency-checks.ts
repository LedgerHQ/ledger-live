import { checkLockfile } from "../dependency-checks/check-lockfile";

async function validateDependencyChecks() {
  const message = checkLockfile();
  if (message) fail(message);
}

export default validateDependencyChecks;
