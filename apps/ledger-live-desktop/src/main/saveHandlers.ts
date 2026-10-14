import { getEnv } from "@shared/env";
import { dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { CHANNELS, type SaveOutcome, type SaveRequest } from "~/bridge/contract";
import { isPlaywrightRun } from "./isPlaywrightRun";
import { InMemoryLogger } from "./logger";
import { mergeAllLogsJSON } from "./mergeAllLogs";

function resolveE2ePath(e2ePath: string): string {
  const root = process.cwd();
  const target = path.resolve(root, e2ePath);
  if (!target.startsWith(root + path.sep)) {
    throw new Error(`E2E save path escapes the working directory: ${e2ePath}`);
  }
  return target;
}

// Main owns the path, so the renderer cannot turn a write handler into an arbitrary file write.
async function resolveSaveTarget({ options, e2ePath }: SaveRequest): Promise<string | null> {
  if (e2ePath && isPlaywrightRun()) return resolveE2ePath(e2ePath);
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  return canceled || !filePath ? null : filePath;
}

ipcMain.handle(
  CHANNELS.saveLogs,
  async (_event, request: SaveRequest, rendererLogsStr: string): Promise<SaveOutcome> => {
    let target: string | null;
    try {
      target = await resolveSaveTarget(request);
    } catch (e) {
      console.warn("Could not open the save dialog for the logs", e);
      return "failed";
    }
    if (!target) return "canceled";

    const internalLogsChronological = InMemoryLogger.getLogger().getLogs().reverse();

    let rendererLogsChronological: Array<{ timestamp: string }> = [];
    try {
      rendererLogsChronological = JSON.parse(rendererLogsStr).reverse();
    } catch (e) {
      console.warn("Error while parsing logs from the renderer process", e);
      return "failed";
    }

    try {
      await fs.writeFile(
        target,
        mergeAllLogsJSON(
          rendererLogsChronological,
          internalLogsChronological,
          getEnv("EXPORT_MAX_LOGS"),
        ),
      );
      return "saved";
    } catch (e) {
      console.warn("Could not write the exported logs", e);
      return "failed";
    }
  },
);

ipcMain.handle(
  CHANNELS.exportOperations,
  async (_event, request: SaveRequest, csv: string): Promise<SaveOutcome> => {
    if (!csv) return "failed";
    try {
      const target = await resolveSaveTarget(request);
      if (!target) return "canceled";
      await fs.writeFile(target, csv);
      return "saved";
    } catch {
      return "failed";
    }
  },
);

ipcMain.handle(
  CHANNELS.savePng,
  async (_event, options: Electron.SaveDialogOptions, base64: string): Promise<SaveOutcome> => {
    if (!base64) return "failed";
    try {
      const target = await resolveSaveTarget({ options });
      if (!target) return "canceled";
      await fs.writeFile(target, Buffer.from(base64, "base64"));
      return "saved";
    } catch {
      return "failed";
    }
  },
);
