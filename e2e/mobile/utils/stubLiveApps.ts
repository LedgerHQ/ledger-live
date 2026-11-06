import { createServer } from "node:http";
import { device, log } from "detox";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { importLocalManifests } from "@e2e/bridge/server";
import { fetchLiveAppCatalog } from "@e2e/utils/liveAppCatalog";

const STUB_PAGE = "<!doctype html><title>Live app stub</title><p>Live app stub</p>";

let stubOrigin: Promise<string> | undefined;

function startStubServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(STUB_PAGE);
    });
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("stubLiveApps: the stub server has no TCP port"));
        return;
      }
      const { port } = address;
      const reverse = device.getPlatform() === "android" ? device.reverseTcpPort(port) : undefined;
      Promise.resolve(reverse).then(() => resolve(`http://localhost:${port}`), reject);
    });
  });
}

/**
 * Makes the catalog live apps that match load a blank local page instead of their site, and
 * returns that page's origin. The page path is the live app id.
 */
export async function stubLiveApps(
  matches: (manifest: LiveAppManifest) => boolean,
): Promise<string> {
  stubOrigin ??= startStubServer();
  const origin = await stubOrigin;
  const manifests = (await fetchLiveAppCatalog()).filter(matches);
  if (!manifests.length) {
    throw new Error("stubLiveApps: no catalog manifest matched");
  }
  const stubs = manifests.map(manifest => {
    const url = `${origin}/${manifest.id}/`;
    return { ...manifest, url, homepageUrl: url, domains: [origin] };
  });
  await importLocalManifests(stubs);
  log.info(`[E2E] Stubbed live apps: ${stubs.map(({ id, url }) => `${id} → ${url}`).join(", ")}`);
  return origin;
}
