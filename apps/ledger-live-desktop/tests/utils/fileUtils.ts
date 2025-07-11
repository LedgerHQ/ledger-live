import { appendFile } from "fs/promises";

export async function safeAppendFile(filePath: string, data: string) {
  try {
    await appendFile(filePath, data);
  } catch (e) {
    if (e) console.error("couldn't append file", e);
  }
}
