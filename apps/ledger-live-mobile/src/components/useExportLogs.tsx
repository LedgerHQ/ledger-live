import { useCallback } from "react";
import Share from "react-native-share";
import RNFetchBlob from "rn-fetch-blob";
import logger from "../logger";
import logReport from "../log-report";
import getFullAppVersion from "~/logic/version";

const getJSONStringifyReplacer: () => (key: string, value: unknown) => unknown = () => {
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
    // @ts-expect-error explained up
    while (ancestors.length > 0 && ancestors.at(-1) !== (this as unknown)) {
      ancestors.pop();
    }
    if (ancestors.includes(value)) {
      return "[Circular]";
    }
    ancestors.push(value);
    return value;
  };
};

export default function useExportLogs() {
  return useCallback(() => {
    const exportLogs = async () => {
      const logs = logReport.getLogs();
      const base64 = Buffer.from(JSON.stringify(logs, getJSONStringifyReplacer(), 2)).toString(
        "base64",
      );
      const version = getFullAppVersion(undefined, undefined, "-");
      const date = new Date().toISOString().split("T")[0];

      const humanReadableName = `ledger-live-mob-${version}-${date}-logs.txt`;
      const filePath = `${RNFetchBlob.fs.dirs.DocumentDir}/${humanReadableName}`;

      try {
        await RNFetchBlob.fs.writeFile(filePath, base64, "base64");
        const options = {
          failOnCancel: false,
          saveToFiles: true,
          type: "text/plain",
          url: `file://${filePath}`,
        };

        await Share.open(options);
      } catch (err) {
        if ((err as { error?: { code?: string } })?.error?.code !== "ECANCELLED500") {
          logger.critical(err as Error);
        }
      }
    };
    exportLogs();
  }, []);
}
