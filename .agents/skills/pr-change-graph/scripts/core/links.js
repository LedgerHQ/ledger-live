import { createHash } from "node:crypto";

/**
 * Pull request URL without a trailing slash or tab (`/files`, `/commits`, `/checks`).
 * @param {string | undefined} url
 */
export function normalizePullRequest(url) {
  return url?.replace(/\/+$/, "").replace(/\/(?:files|commits|checks)$/, "");
}

/**
 * The file's entry in the pull request's "Files changed" tab, whose anchor is the SHA-256 of its path.
 * @param {string} pullRequest
 * @param {string} rel
 */
export function diffUrl(pullRequest, rel) {
  return `${pullRequest}/files#diff-${createHash("sha256").update(rel).digest("hex")}`;
}
