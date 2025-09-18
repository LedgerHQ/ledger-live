import logger from "~/renderer/logger";

const currentTermsRequired = "2022-05-10";

function isAcceptedVersionUpToDate(acceptedVersion: string | null, currentVersion: string) {
  if (!acceptedVersion) {
    return false;
  }
  try {
    const acceptedTermsVersion = new Date(acceptedVersion);
    const currentTermsVersion = new Date(currentVersion);
    return acceptedTermsVersion >= currentTermsVersion;
  } catch (error) {
    logger.error(`Failed to parse terms version's dates: ${error}`);
    return false;
  }
}

export function isAcceptedTerms() {
  return isAcceptedVersionUpToDate(
    global.localStorage.getItem("acceptedTermsVersion"),
    currentTermsRequired,
  );
}

export function acceptTerms() {
  return global.localStorage.setItem("acceptedTermsVersion", currentTermsRequired);
}
