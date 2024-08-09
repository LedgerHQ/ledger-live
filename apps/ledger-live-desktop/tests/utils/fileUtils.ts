import crypto from "crypto";
import { appendFile } from "fs/promises";

export function generateUUID(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function safeAppendFile(filePath: string, data: string) {
  try {
    await appendFile(filePath, data);
  } catch (e: any) {
    if (e) console.error("couldn't append file", e);
  }
}
