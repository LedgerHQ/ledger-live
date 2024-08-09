import { LedgerAPI4xx } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { AuthCachePolicy, JWT } from "./types";
import { TrustchainNotAllowed, TrustchainOutdated } from "./errors";

export async function genericWithJWT<T>(
  job: (jwt: JWT) => Promise<T>,
  initialJWT: JWT | undefined,
  auth: () => Promise<JWT>,
  refreshAuth: (jw: JWT) => Promise<JWT>,
  policy: AuthCachePolicy = "cache",
): Promise<T> {
  function refresh(jwt: JWT) {
    return refreshAuth(jwt).catch(e => {
      log("trustchain", "JWT refresh failed, reauthenticating", e);
      const { hasExpired, isNotPermitted, isTrustchainOutdated } = networkCheckJwtExpiration(e);
      if (isNotPermitted) {
        throw new TrustchainNotAllowed();
      }
      if (isTrustchainOutdated) {
        throw new TrustchainOutdated();
      }
      if (hasExpired) {
        return auth();
      }
      throw e;
    });
  }

  // initial jwt depending on the policy
  let jwt =
    policy === "no-cache" || !initialJWT
      ? await auth()
      : policy === "refresh"
        ? await refresh(initialJWT)
        : initialJWT;

  return job(jwt).catch(async e => {
    // JWT expiration handling: if the function fails, we will recover a valid jwt accordingly to spec. https://ledgerhq.atlassian.net/wiki/spaces/BE/pages/4207083687/TCH+Usage+documentation#JWT-expiration-handling
    const { hasExpired, canBeRefreshed, isNotPermitted, isTrustchainOutdated } =
      networkCheckJwtExpiration(e);
    if (isNotPermitted) {
      throw new TrustchainNotAllowed();
    }
    if (isTrustchainOutdated) {
      throw new TrustchainOutdated();
    }
    if (hasExpired) {
      log("trustchain", "JWT expired -> " + (canBeRefreshed ? "refreshing" : "reauthenticating"));
      jwt = await (jwt && canBeRefreshed ? refresh(jwt) : auth());
      return job(jwt);
    }
    throw e;
  });
}

type JwtExpirationCheck = {
  hasExpired: boolean;
  canBeRefreshed: boolean;
  isNotPermitted: boolean;
  isTrustchainOutdated: boolean;
};

function networkCheckJwtExpiration(error: unknown): JwtExpirationCheck {
  let hasExpired = false;
  let canBeRefreshed = false;
  let isNotPermitted = false;
  let isTrustchainOutdated = false;
  // this assume live-network is used and we adapt to its error's format
  if (error instanceof LedgerAPI4xx) {
    if (error.message.includes("JWT is expired")) {
      hasExpired = true;
      canBeRefreshed = error.message.includes("/refresh");
    } else if (error.message.includes("JWT contains no permission")) {
      isNotPermitted = true;
    } else if (error.message.includes("path does not match")) {
      isTrustchainOutdated = true;
    }
  }
  return { hasExpired, canBeRefreshed, isNotPermitted, isTrustchainOutdated };
}
