import Share, { ShareOptions } from "react-native-share";
import RNFetchBlob from "rn-fetch-blob";
import { getEnv } from "@ledgerhq/live-env";
import { sendFile } from "../../../e2e/bridge/client";
import logger from "~/logger";

type ExportFileOptions = {
  content: string;
  filename: string;
  type: string;
  title?: string;
  message?: string;
  detoxFileName?: string;
};

export async function exportFile({
  content,
  filename,
  type,
  title,
  message,
  detoxFileName,
}: ExportFileOptions): Promise<void> {
  const filePath = `${RNFetchBlob.fs.dirs.DocumentDir}/${filename}`;
  await RNFetchBlob.fs.writeFile(filePath, content, "utf8");

  if (getEnv("DETOX")) {
    const fileContent = await RNFetchBlob.fs.readFile(filePath, "utf8");
    sendFile({ fileName: detoxFileName || filename, fileContent });
  } else {
    const fileExists = await RNFetchBlob.fs.exists(filePath);
    if (!fileExists) {
      throw new Error("Failed to create export file");
    }

    const options: ShareOptions = {
      failOnCancel: false,
      saveToFiles: true,
      type,
      filename,
      url: filePath,
      ...(title && { title }),
      ...(message && { message }),
    };

    try {
      await Share.open(options);
    } catch (err) {
      if ((err as { error?: { code?: string } })?.error?.code !== "ECANCELLED500") {
        logger.critical(err as Error);
      }
    }
  }
}
