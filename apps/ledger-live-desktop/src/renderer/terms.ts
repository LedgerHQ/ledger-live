import logger from "~/renderer/logger";

const currentTermsRequired = "2022-05-10";
const currentLendingTermsRequired = "2020-11-10";

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

export function isAcceptedLendingTerms() {
  return isAcceptedVersionUpToDate(
    global.localStorage.getItem("acceptedLendingTermsVersion"),
    currentLendingTermsRequired,
  );
}

export function acceptTerms() {
  return global.localStorage.setItem("acceptedTermsVersion", currentTermsRequired);
}

export function acceptLendingTerms() {
  return global.localStorage.setItem("acceptedLendingTermsVersion", currentLendingTermsRequired);
}
