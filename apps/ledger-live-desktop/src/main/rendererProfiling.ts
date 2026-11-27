import { app, net, protocol } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROFILING_DOCUMENT_POLICY = "js-profiling";
const PACKAGED_BUILD = ["app.asar", ".webpack"];
// The AppImage runtime mounts at /tmp/.mount_ + the file name's first 6 characters + 6 random ones.
const DEFAULT_APPIMAGE_MOUNT = /^\.mount_ledger[A-Za-z0-9]{6}$/;

export type InstallLocation = {
  platform: NodeJS.Platform;
  appName: string;
  env: NodeJS.ProcessEnv;
};

const isLaidOutAs = (
  pathApi: typeof path.posix,
  buildDirectory: string,
  root: string,
  expected: (string | RegExp)[],
) => {
  const segments = pathApi.relative(root, buildDirectory).split(pathApi.sep);
  const sameSegment =
    pathApi === path.win32
      ? (a: string, b: string) => a.toLowerCase() === b.toLowerCase()
      : (a: string, b: string) => a === b;
  return (
    segments.length === expected.length &&
    expected.every((part, i) =>
      typeof part === "string" ? sameSegment(segments[i], part) : part.test(segments[i]),
    )
  );
};

/** Whether the build runs from its default install folder, a path no user chose or named. */
export function isDefaultInstallLocation(
  buildDirectory: string,
  { platform, appName, env }: InstallLocation,
): boolean {
  switch (platform) {
    case "darwin":
      return isLaidOutAs(path.posix, buildDirectory, "/Applications", [
        `${appName}.app`,
        "Contents",
        "Resources",
        ...PACKAGED_BUILD,
      ]);
    case "win32":
      return [env.ProgramFiles, env["ProgramFiles(x86)"], env.ProgramW6432].some(
        root =>
          !!root &&
          isLaidOutAs(path.win32, buildDirectory, root, [appName, "resources", ...PACKAGED_BUILD]),
      );
    case "linux":
      return isLaidOutAs(path.posix, buildDirectory, "/tmp", [
        DEFAULT_APPIMAGE_MOUNT,
        "resources",
        ...PACKAGED_BUILD,
      ]);
    default:
      return false;
  }
}

const toFilePath = (url: string): string | undefined => {
  try {
    return path.resolve(fileURLToPath(url));
  } catch {
    return undefined;
  }
};

export function createRendererFileHandler(buildDirectory: string) {
  const indexPath = path.join(buildDirectory, "index.html");
  return async (request: Request): Promise<Response> => {
    const file = toFilePath(request.url);
    if (!file?.startsWith(buildDirectory + path.sep)) return new Response(null, { status: 403 });
    const response = await net.fetch(pathToFileURL(file).href, {
      headers: request.headers,
      bypassCustomProtocolHandlers: true,
    });
    if (file !== indexPath) return response;
    const headers = new Headers(response.headers);
    headers.set("Document-Policy", PROFILING_DOCUMENT_POLICY);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

const runningAppLocation = (): InstallLocation => ({
  platform: process.platform,
  appName: app.getName(),
  env: process.env,
});

// Profiles skip beforeSend and list script paths: only profile a build in its default folder.
export function allowRendererProfiling(
  buildDirectory: string,
  location = runningAppLocation(),
): boolean {
  if (!isDefaultInstallLocation(buildDirectory, location)) return false;
  protocol.handle("file", createRendererFileHandler(buildDirectory));
  return true;
}
