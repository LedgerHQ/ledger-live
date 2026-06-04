import { Platform, TurboModuleRegistry } from "react-native";
import RNFetchBlob from "rn-fetch-blob";
import {
  getDocumentPicker,
  isDocumentPickerCancelled,
} from "./documentPickerBridge";
import type { DocumentPickerOptions } from "@react-native-documents/picker";

export type PickedLottieFile = {
  uri: string;
  name: string;
};

type PickedDocument = {
  uri: string;
  name?: string | null;
  error?: string | null;
  isVirtual?: boolean | null;
  convertibleToMimeTypes?: Array<{ mimeType: string }> | null;
};

let stashedPick: PickedLottieFile | null = null;

/** Survives screen remounts when the system document picker backgrounds the app. */
export function stashDebugLottiePick(file: PickedLottieFile): void {
  stashedPick = file;
}

export function consumeStashedDebugLottiePick(): PickedLottieFile | null {
  const file = stashedPick;
  stashedPick = null;
  return file;
}

export const DOCUMENT_PICKER_REBUILD_MESSAGE =
  "Document picker is unavailable. Rebuild the native app after installing the dependency (pnpm ios or pnpm android).";

export class InvalidLottieExtensionError extends Error {
  constructor(fileName: string) {
    super(`"${fileName}" is not a .lottie file`);
    this.name = "InvalidLottieExtensionError";
  }
}

function resolvePickedFileName(file: PickedDocument): string {
  const name = file.name?.trim();
  if (name) {
    return name;
  }

  const uriPath = decodeURIComponent(file.uri.split("?")[0]?.split("#")[0] ?? "");
  const baseName = uriPath.split("/").pop();
  if (baseName) {
    return baseName;
  }

  return "animation.lottie";
}

function isLottieFile(fileName: string, uri: string): boolean {
  const normalized = `${fileName} ${uri}`.toLowerCase();
  return normalized.includes(".lottie");
}

function isDocumentPickerNativeModuleAvailable(): boolean {
  return TurboModuleRegistry.get("RNDocumentPicker") != null;
}

function getPickErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (!(error instanceof Error)) {
    return "Failed to pick file";
  }

  if (
    error.message.includes("RNDocumentPicker") ||
    error.message.includes("TurboModuleRegistry.getEnforcing") ||
    error.message.includes("Document picker module failed to load") ||
    error.message === DOCUMENT_PICKER_REBUILD_MESSAGE
  ) {
    return DOCUMENT_PICKER_REBUILD_MESSAGE;
  }

  return error.message;
}

function ensureDotLottieFileName(fileName: string): string {
  return fileName.replace(/\.lottie$/i, ".lottie");
}

function normalizeLottieFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed.startsWith("file://")) {
    return trimmed;
  }

  return encodeURI(trimmed);
}

function getPickOptions(): DocumentPickerOptions {
  const { types } = getDocumentPicker();

  if (Platform.OS === "android") {
    return {
      mode: "open",
      requestLongTermAccess: false,
      type: [types.allFiles],
      allowMultiSelection: false,
    };
  }

  return {
    mode: "import",
    type: [types.allFiles],
    allowMultiSelection: false,
  };
}

function normalizePickResults(results: unknown): PickedDocument[] {
  if (Array.isArray(results)) {
    return results as PickedDocument[];
  }

  if (results && typeof results === "object" && "uri" in results) {
    return [results as PickedDocument];
  }

  return [];
}

async function copyWithDocumentPicker(
  file: PickedDocument,
  uri: string,
  copyFileName: string,
): Promise<string> {
  const { keepLocalCopy } = getDocumentPicker();
  const fileToCopy: {
    uri: string;
    fileName: string;
    convertVirtualFileToType?: string;
  } = { uri, fileName: copyFileName };

  if (Platform.OS === "android" && file.isVirtual && file.convertibleToMimeTypes?.length) {
    fileToCopy.convertVirtualFileToType = file.convertibleToMimeTypes[0]?.mimeType;
  }

  const [copyResult] = await keepLocalCopy({
    files: [fileToCopy],
    destination: "documentDirectory",
  });

  if (copyResult.status !== "success") {
    const copyError =
      copyResult.status === "error" ? copyResult.copyError : "Failed to copy picked file locally";
    throw new Error(copyError);
  }

  if (!copyResult.localUri?.trim()) {
    throw new Error("Copied file has no local URI");
  }

  return normalizeLottieFileUri(copyResult.localUri);
}

async function copyPickedUriToDocumentDir(sourceUri: string, fileName: string): Promise<string> {
  const destPath = `${RNFetchBlob.fs.dirs.DocumentDir}/${fileName}`;

  if (await RNFetchBlob.fs.exists(destPath)) {
    await RNFetchBlob.fs.unlink(destPath);
  }

  await RNFetchBlob.config({ path: destPath }).fetch("GET", sourceUri);

  return normalizeLottieFileUri(`file://${destPath}`);
}

async function resolvePlayableUri(file: PickedDocument, fileName: string): Promise<string> {
  const uri = file.uri.trim();
  const copyFileName = ensureDotLottieFileName(fileName);

  if (uri.startsWith("file://")) {
    return normalizeLottieFileUri(uri);
  }

  try {
    return await copyWithDocumentPicker(file, uri, copyFileName);
  } catch (documentPickerCopyError) {
    if (Platform.OS !== "android") {
      throw documentPickerCopyError;
    }

    try {
      return await copyPickedUriToDocumentDir(uri, copyFileName);
    } catch {
      throw documentPickerCopyError;
    }
  }
}

function validatePickedDocument(file: PickedDocument | undefined): PickedDocument {
  if (!file) {
    throw new Error("No file was returned by the document picker");
  }

  if (file.error) {
    throw new Error(file.error);
  }

  if (!file.uri?.trim()) {
    throw new Error("The selected file has no URI");
  }

  return file;
}

export async function pickLocalLottieFile(): Promise<PickedLottieFile | null> {
  if (!isDocumentPickerNativeModuleAvailable()) {
    throw new Error(DOCUMENT_PICKER_REBUILD_MESSAGE);
  }

  const { pick } = getDocumentPicker();

  try {
    const results = normalizePickResults(await pick(getPickOptions()));

    if (!results.length) {
      throw new Error("The document picker closed without returning a file.");
    }

    const file = validatePickedDocument(results[0]);
    const fileName = resolvePickedFileName(file);

    if (!isLottieFile(fileName, file.uri)) {
      throw new InvalidLottieExtensionError(fileName);
    }

    const uri = await resolvePlayableUri(file, fileName);
    const picked = { uri, name: ensureDotLottieFileName(fileName) };
    stashDebugLottiePick(picked);
    return picked;
  } catch (error) {
    if (isDocumentPickerCancelled(error)) {
      return null;
    }
    if (error instanceof InvalidLottieExtensionError) {
      throw error;
    }

    const wrappedError = new Error(getPickErrorMessage(error));
    (wrappedError as Error & { cause?: unknown }).cause = error;
    throw wrappedError;
  }
}
