import fs from "fs";
import * as github from "@actions/github";
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
  console.log("retrieving " + url);
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

export async function submitCommentToPR({
  reporter,
  prNumber,
  githubToken,
}: {
  reporter: Reporter;
  prNumber: string;
  githubToken: string;
}): Promise<void> {
  const octokit = github.getOctokit(githubToken);
  const body = reporter.toMarkdown();
  if (body.length === 0) return;
  // FIXME we should check if the comment already exists and update it instead
  await octokit.rest.issues.createComment({
    owner: "ledgerhq",
    repo: "ledger-live",
    issue_number: parseInt(prNumber, 10),
    body,
  });
}

const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));

function isDateBefore(a: string | Date, b: string | Date) {
  return new Date(a) < new Date(b);
}

export class Reporter {
  statements: string[] = [];

  improvement(message: string) {
    this.statements.push(`✅ 💪 ${message}`);
  }
  warning(message: string) {
    this.statements.push(`⚠️ ${message}`);
  }
  error(message: string) {
    this.statements.push(`❌ ${message}`);
  }

  toMarkdown() {
    return this.statements.map(o => `- ${o}`).join("\n");
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}kb`;
  } else {
    return `${Math.round(bytes / 1024 / 1024)}mb`;
  }
}
