import { colors } from "@bunli/utils";
import pkg from "../../package.json" with { type: "json" };
import { writeStderr } from "./ui";

const BANNER_LINES = [
  "################################################################################",
  "#                                                                              #",
  "#                         T E S T I N G   B U I L D                            #",
  "#                                                                              #",
  "################################################################################",
];

/**
 * Prerelease / non-release versions use a dash in semver (e.g. 1.0.0-next.0).
 * Show a stderr warning for those builds so they are easy to spot in logs.
 */
export function emitTestingBuildBannerIfNeeded(): void {
  if (!pkg.version.includes("-")) return;

  const text = BANNER_LINES.join("\n");
  if (process.stderr.isTTY) {
    writeStderr(`${colors.yellow(text)}\n\n`);
  } else {
    writeStderr(`${text}\n\n`);
  }
}
