"use strict";

/**
 * Single source of truth for Nx S3 cache key prefix and (when configured) OIDC role selection.
 *
 * @param {{
 *   githubRef: string;
 *   developRoleArn?: string;
 *   branchRoleArn?: string;
 *   legacyAccountId?: string;
 *   legacyRoleName?: string;
 * }} params
 * @returns {{ roleArn: string; nxCacheKeyPrefix: string; cacheProfile: "develop" | "branch" }}
 */
function resolveNxRemoteCacheProfile(params) {
  const githubRef = params.githubRef || "";
  const isDevelop = githubRef === "refs/heads/develop";
  const cacheProfile = isDevelop ? "develop" : "branch";
  const nxCacheKeyPrefix = cacheProfile;

  const developArn = (params.developRoleArn || "").trim();
  const branchArn = (params.branchRoleArn || "").trim();
  const legacyAccount = (params.legacyAccountId || "").trim();
  const legacyRole = (params.legacyRoleName || "").trim();

  let roleArn = "";
  if (developArn && branchArn) {
    roleArn = isDevelop ? developArn : branchArn;
  } else if (legacyAccount && legacyRole) {
    roleArn = `arn:aws:iam::${legacyAccount}:role/${legacyRole}`;
  }

  return { roleArn, nxCacheKeyPrefix, cacheProfile };
}

module.exports = { resolveNxRemoteCacheProfile };
