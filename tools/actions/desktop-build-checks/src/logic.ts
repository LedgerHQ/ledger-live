import fs from "fs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { Parse } from "unzipper";
import { parser } from "stream-json";
import { streamValues } from "stream-json/streamers/StreamValues";
import { Readable } from "stream";
import path from "path";

export const metafilesKeys = {
  main: "metafile.main.json",
  preloader: "metafile.preloader.json",
  renderer: "metafile.renderer.json",
  rendererWorker: "metafile.renderer.worker.json",
  webviewPreloader: "metafile.webviewPreloader.json",
};
type ValueOf<T> = T[keyof T];
export type MetafileSlug = keyof typeof metafilesKeys;
export type MetafileKey = ValueOf<typeof metafilesKeys>;

export interface FileImport {
  path: string;
  kind: string;
  original?: string;
  external?: boolean;
}

export interface FileBytes {
  bytes: number;
  imports: FileImport[];
  format?: string;
}

export interface OutputFile {
  imports: FileImport[];
  exports: [];
  inputs: { [key: string]: { bytesInOutput: number } };
  bytes: number;
  entryPoint?: string;
}

export interface Metafile {
  inputs: { [key: string]: FileBytes };
  outputs: { [key: string]: OutputFile };
}

export type Metafiles = {
  [K in MetafileKey]?: Metafile;
};

export function getMetafileBundleSize(metafile: Metafiles, slug: MetafileSlug): number | undefined {
  const key = metafilesKeys[slug];
  if (key in metafile) {
    return metafile[key]?.outputs[`.webpack/${slug}.bundle.js`]?.bytes;
  }
}

export function getMetafileDuplicates(metafiles: Metafiles, slug: MetafileSlug): string[] {
  const all = [];
  const key = metafilesKeys[slug];
  if (key in metafiles) {
    const m = metafiles[key]!;
    // inspired from https://github.com/esbuild/esbuild.github.io/blob/main/src/analyze/warnings.ts
    const inputs = m.inputs;
    const resolvedPaths: Record<string, string[]> = {};
    for (const i in inputs) {
      const input = inputs[i];
      for (const record of input.imports) {
        if (record.original && record.original[0] !== ".") {
          const array = resolvedPaths[record.original] || (resolvedPaths[record.original] = []);
          if (!array.includes(record.path)) array.push(record.path);
        }
      }
    }
    for (const original in resolvedPaths) {
      const array = resolvedPaths[original];
      if (array.length > 1) {
        all.push(original);
      }
    }
  }
  return all;
}

type Octokit = ReturnType<typeof github.getOctokit>;
export type Artifact = Awaited<
  ReturnType<Octokit["rest"]["actions"]["listArtifactsForRepo"]>
>["data"]["artifacts"][0];

export async function getRecentArtifactFromBranch(
  octokit: Octokit,
  name: string,
  branch: string,
  maxDays: number = 7,
): Promise<Artifact | undefined> {
  const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000 * maxDays);

  const artifactsByDate: [Artifact, Date][] = [];
  let page = 1;
  let latestDateReached = false;
  let res;

  do {
    res = await octokit.rest.actions.listArtifactsForRepo({
      name,
      owner: "ledgerhq",
      repo: "ledger-live",
      per_page: 100,
      page,
    });

    res.data.artifacts.forEach(a => {
      if (!branch || a.workflow_run?.head_branch === branch) {
        if (!dateFrom || (a.created_at && isDateBefore(dateFrom, a.created_at))) {
          artifactsByDate.push([a, new Date(a.created_at || 0)]);
        } else {
          latestDateReached = true;
        }
      }
    });

    page++;
    await delay(500);
  } while (res && res.data && res.data.artifacts.length > 0 && !latestDateReached);

  artifactsByDate.sort((a, b) => b[1].getTime() - a[1].getTime());

  if (artifactsByDate.length === 0) {
    return undefined;
  }
  return artifactsByDate[0][0];
}

export async function downloadMetafilesFromArtifact(
  githubToken: string,
  url: string,
): Promise<Metafiles> {
  core.info("Downloading Metafiles: " + url);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    },
  });
  const blob = await res.blob();
  const stream = Readable.fromWeb(blob.stream());
  return zipStreamToMetafiles(stream);
}

function zipStreamToMetafiles(stream: Readable): Promise<Metafiles> {
  const bundles: Metafiles = {};
  return new Promise((resolve, reject) => {
    stream
      .pipe(Parse())
      .on("entry", entry => {
        const fileName = entry.path;
        if (fileName.includes("metafile")) {
          entry
            .pipe(parser())
            .pipe(streamValues())
            .on("data", (e: { value: Metafile }) => (bundles[entry.path as MetafileKey] = e.value))
            .on("error", reject);
        } else {
          entry.autodrain();
        }
      })
      .on("finish", () => {
        resolve(bundles);
      });
  });
}

export async function jsonFileToMetafiles(folder: string): Promise<Metafiles> {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(folder);
    const bundles: Metafiles = {};
    for (const file of files) {
      const p = path.join(folder, file);
      if (!fs.lstatSync(p).isFile()) return;

      if (file.includes("metafile")) {
        try {
          const content = fs.readFileSync(p, "utf8");
          const parsed = JSON.parse(content) as Metafile;
          bundles[file as MetafileKey] = parsed;
        } catch (error) {
          reject(error);
        }
      }
    }
    resolve(bundles);
  });
}

export async function retrieveLocalMetafiles(folder: string): Promise<Metafiles> {
  return jsonFileToMetafiles(folder);
}

export async function findComment({
  prNumber,
  githubToken,
  header,
}: {
  header: string;
  prNumber: string;
  githubToken: string;
}) {
  const octokit = github.getOctokit(githubToken);
  const comments = await octokit.rest.issues.listComments({
    issue_number: parseInt(prNumber, 10),
    repo: "ledger-live",
    owner: "ledgerhq",
  });

  return comments.data.find(c => c.body?.includes(header));
}

export async function deleteComment({
  githubToken,
  found,
}: {
  githubToken: string;
  found: Awaited<ReturnType<typeof findComment>>;
}) {
  if (!found) return;
  const octokit = github.getOctokit(githubToken);
  await octokit.rest.issues.deleteComment({
    owner: "ledgerhq",
    repo: "ledger-live",
    comment_id: found.id,
  });
}

export async function createOrUpdateComment({
  body,
  prNumber,
  githubToken,
  found,
}: {
  body: string;
  prNumber: string;
  githubToken: string;
  found: Awaited<ReturnType<typeof findComment>>;
}) {
  const octokit = github.getOctokit(githubToken);

  if (found) {
    core.info(`Updating comment ${found.id}`);
    await octokit.rest.issues.updateComment({
      repo: "ledger-live",
      owner: "ledgerhq",
      comment_id: found?.id,
      body,
    });

    return;
  }

  core.info(`Creating new comment`);
  await octokit.rest.issues.createComment({
    repo: "ledger-live",
    owner: "ledgerhq",
    issue_number: parseInt(prNumber, 10),
    body,
  });
}

export async function submitCommentToPR({
  reporter,
  prNumber,
  githubToken,
  currentSha,
  referenceSha,
}: {
  reporter: Reporter;
  prNumber: string;
  githubToken: string;
  currentSha: string;
  referenceSha: string;
}): Promise<void> {
  core.info("Submiting comment to PR");
  const header = `<!-- desktop-build-checks-${prNumber} -->`;
  const title = `### Desktop Build Checks
> Comparing ${formatHash(currentSha)} against ${formatHash(referenceSha)}.
`;
  core.info("Looking for existing comment");
  const found = await findComment({ prNumber, githubToken, header });
  core.info(found ? `Found previous comment ${found.id}` : "No previous comment to update");
  const body = reporter.toMarkdown();

  if (reporter.isEmpty() && found) {
    const allGood = `
${header}

${title}

✅ Previous issues have all been fixed.`;
    await createOrUpdateComment({ body: allGood, prNumber, githubToken, found });
    return;
  }

  if (reporter.isEmpty()) {
    core.info("Nothing to report");
    return;
  }

  const comment = `${header}

${title}

${body}
`;
  await createOrUpdateComment({ body: comment, prNumber, githubToken, found });
}

const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));

function isDateBefore(a: string | Date, b: string | Date) {
  return new Date(a) < new Date(b);
}

export class Reporter {
  statements: string[] = [];

  improvement(message: string) {
    this.statements.push(`🚀 ${message}`);
  }
  warning(message: string) {
    this.statements.push(`⚠️ ${message}`);
  }
  error(message: string) {
    this.statements.push(`❌ ${message}`);
  }

  isEmpty() {
    return this.statements.length === 0;
  }

  toMarkdown() {
    return this.statements.join("\n");
  }
}

export function formatSize(bytes: number | undefined, precision: number = 1): string {
  if (!bytes) return "N/A";
  const mag = Math.pow(10, precision);
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${Math.round((mag * bytes) / 1024) / mag}kb`;
  } else {
    return `${Math.round((mag * bytes) / 1024 / 1024) / mag}mb`;
  }
}

export function formatMarkdownBoldList(items: string[]) {
  if (items.length === 0) return "";
  const map = items.map(item => `**${item}**`);
  if (map.length === 1) return map[0];
  return map.slice(0, items.length - 1).join(", ") + " and " + map[items.length - 1];
}

export function formatHash(hash: string | undefined) : string {
  return hash
    ? `[\`${hash.slice(0, 7)}\`](https://github.com/LedgerHQ/ledger-live/commit/${hash})`
    : "_unknown_";
}