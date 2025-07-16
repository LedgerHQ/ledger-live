import { ipcRenderer } from "electron";
import { memoryLogger } from "~/renderer/logger";

export function getJSONStringifyReplacer(): (key: string, value: unknown) => unknown {
  const ancestors: unknown[] = [];
  return function (_: string, value: unknown): unknown {
    // format Uint8Array values to more readable format
    if (value instanceof Uint8Array) {
      const bytesHex = Array.from(value).map(x => x.toString(16).padStart(2, "0"));
      return {
        hex: "0x" + bytesHex.join(""),
        readableHex: bytesHex.join(" "),
        value: value.toString(),
      };
    }

    // format circular references to "[Circular]"
    // Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value#circular_references
    if (typeof value !== "object" || value === null) {
      return value;
    }
    // `this` is the object that value is contained in,
    // i.e., its direct parent.
    // @ts-expect-error cf. comment above
    while (ancestors.length > 0 && ancestors.at(-1) !== (this as unknown)) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    ancestors.push(value);
    return value;
  };
}

export const saveLogs = async (path: Electron.SaveDialogReturnValue) => {
  try {
    // Serializes ourself with `stringify` to avoid "object could not be cloned" errors from the electron IPC serializer.
    // Uses getJSONStringifyReplacer to replace circular references with "[Circular]"
    const memoryLogsStr = JSON.stringify(
      memoryLogger.getMemoryLogs(),
      getJSONStringifyReplacer(),
      2,
    );

    // Requests the main process to save logs in a file
    await ipcRenderer.invoke("save-logs", path, memoryLogsStr);
  } catch (error) {
    console.error("Error while requesting to save logs from the renderer process", error);
  }
};
