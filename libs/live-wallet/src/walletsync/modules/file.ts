import {
  WalletSyncDataManager,
  WalletSyncDataManagerResolutionContext,
  UpdateDiff,
} from "../types.js"; // Assuming types.js exists relative to your file structure
import { z } from "zod";

// File structure
const fileDescriptorSchema = z.object({
  id: z.string(), // Unique identifier for this file instance/document
  name: z.string(), // Original filename
  mimeType: z.string(), // MIME type (e.g., 'image/png', 'application/pdf')
  contentBase64: z.string(), // File content encoded as Base64
  lastModified: z.number(), // Unix timestamp (milliseconds) for LWW conflict resolution
});

export type FileDescriptor = z.infer<typeof fileDescriptorSchema>;

// Document schema for validation
// We wrap the file descriptor in a top-level object, similar to the original structure
const docSchema = z.object({
  file: fileDescriptorSchema,
});

export type FileDoc = z.infer<typeof docSchema>;

// Local data is the plain JS object
type LocalDataType = FileDoc;

// We’ll serialize the whole FileDoc to JSON strings
type SerializedDoc = string;
type DistantStateType = SerializedDoc | null; // Represents the JSON string state from the server/sync source
type UpdateType = SerializedDoc | null; // Represents an incoming JSON string update

// Simple deep-equal via JSON (only safe here because our data is JSON-safe and property order is stable)
// Keep this function as it's useful for comparing states.
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const manager: WalletSyncDataManager<
  LocalDataType,
  UpdateType,
  typeof docSchema,
  DistantStateType
> = {
  schema: docSchema, // Use the new file document schema

  /**
   * Compares the local file document state to the last known distant state.
   * If they differ, it proposes the current local state (serialized) as the next state.
   */
  diffLocalToDistant(localDataDoc, latestStateSerialized) {
    // Serialize current local document
    const localJSON = JSON.stringify(localDataDoc);

    if (!latestStateSerialized) {
      // Nothing on server yet, or hasn't synced before.
      // We definitely have changes if the local doc isn't empty/initial.
      // Let's assume an initial doc might be different from null server state.
      return { hasChanges: true, nextState: localJSON };
    }

    // Compare serialized copies
    if (localJSON !== latestStateSerialized) {
      // Local state is different from the last known server state
      return { hasChanges: true, nextState: localJSON };
    } else {
      // Local state matches the last known server state
      return { hasChanges: false, nextState: null };
    }
  },

  /**
   * Resolves conflicts when an update comes from the distant source.
   * Implements a "Last Write Wins" strategy based on the `lastModified` timestamp.
   */
  async resolveIncrementalUpdate(
    _ctx: WalletSyncDataManagerResolutionContext, // Context might be needed for more complex scenarios
    localDataDoc: LocalDataType,
    _latestStateSerialized: DistantStateType, // The state *before* the incoming update was known
    incomingStateSerialized: UpdateType, // The new state from the distant source
  ): Promise<UpdateDiff<UpdateType>> {
    if (!incomingStateSerialized) {
      // No incoming change data to process
      return { hasChanges: false };
    }

    // Parse the incoming JSON string
    let incomingDoc: FileDoc;
    try {
      incomingDoc = JSON.parse(incomingStateSerialized);
    } catch (e) {
      console.error("Failed to parse incoming file state:", e);
      // Cannot process the incoming state, default to keeping local version
      return { hasChanges: false };
    }

    // Validate the structure of the incoming data
    const parsed = docSchema.safeParse(incomingDoc);
    if (!parsed.success) {
      console.error("Incoming file validation failed:", parsed.error);
      // Incoming data doesn't match schema, default to keeping local version
      return { hasChanges: false };
    }

    // --- Conflict Resolution ---
    // Check if IDs match. If not, it might be data corruption or a different file.
    // Strategy: If IDs differ, assume incoming is irrelevant or erroneous for *this* doc. Keep local.
    if (localDataDoc.file.id !== incomingDoc.file.id) {
      console.warn(
        `Mismatched file IDs during resolve! Local: ${localDataDoc.file.id}, Incoming: ${incomingDoc.file.id}. Keeping local.`,
      );
      return { hasChanges: false };
      // Alternative: Treat ID change as a replacement?
      // return { hasChanges: true, update: incomingStateSerialized };
    }

    // Last Write Wins (LWW) based on timestamp:
    if (incomingDoc.file.lastModified > localDataDoc.file.lastModified) {
      // Incoming document has a newer timestamp. Apply it as the update.
      // We still check deepEqual to avoid triggering updates if the content is identical
      // despite the timestamp change (though unlikely with Date.now()).
      if (!deepEqual(localDataDoc, incomingDoc)) {
        return { hasChanges: true, update: incomingStateSerialized };
      } else {
        return { hasChanges: false };
      }
    } else if (incomingDoc.file.lastModified < localDataDoc.file.lastModified) {
      // Local document is newer. Keep the local version. No update needed from incoming.
      return { hasChanges: false };
    } else {
      // Timestamps are identical.
      // This could mean they are the same, or a conflict happened simultaneously.
      // Safest bet: check content. If different, log warning and keep local (or choose incoming).
      if (!deepEqual(localDataDoc, incomingDoc)) {
        console.warn(
          `File ID ${localDataDoc.file.id} has identical timestamps (${localDataDoc.file.lastModified}) but different content. Keeping local version.`,
        );
        // If you prefer incoming to win in timestamp ties:
        // return { hasChanges: true, update: incomingStateSerialized };
        return { hasChanges: false }; // Keep local in case of timestamp tie + content diff
      } else {
        // Timestamps and content are identical. No change needed.
        return { hasChanges: false };
      }
    }
  },

  /**
   * Applies a validated update (the full, serialized file document) to the local state.
   * Assumes the update has already been chosen by `resolveIncrementalUpdate`.
   */
  applyUpdate(_localDataDoc, updateDoc) {
    if (!updateDoc) {
      // This shouldn't happen if resolveIncrementalUpdate returns hasChanges: true
      throw new Error("applyUpdate received a null or undefined updateDoc");
    }
    // The update is the full state, so we just parse it.
    return JSON.parse(updateDoc) as FileDoc;
  },
};

// --- Helper Functions ---

/**
 * Creates an initial, empty FileDoc state.
 */
export function createInitialFileDoc(id: string): FileDoc {
  return {
    file: {
      id,
      name: "",
      mimeType: "application/octet-stream", // Default MIME type
      contentBase64: "", // Empty content
      lastModified: Date.now(), // Set initial timestamp
    },
  };
}

/**
 * Updates the file data within the document immutably.
 * Expects the file content to already be Base64 encoded.
 * Updates the `lastModified` timestamp.
 */
export function updateFileInDoc(
  currentDoc: FileDoc,
  name: string,
  mimeType: string,
  contentBase64: string, // Caller must provide base64 encoded content
): FileDoc {
  // Ensure the ID remains the same, update other fields and timestamp
  return {
    file: {
      ...currentDoc.file, // Retain the original ID
      name,
      mimeType,
      contentBase64,
      lastModified: Date.now(), // Update timestamp on modification
    },
  };
}

/**
 * Extracts the FileDescriptor (metadata and content) from the document.
 */
export function getFileData(doc: FileDoc): FileDescriptor {
  return doc.file;
}

/**
 * Helper to encode ArrayBuffer/Blob to Base64 (use in your application code before calling updateFileInDoc)
 * Note: This is illustrative. Browser/Node environments have different ways.
 */
export async function encodeFileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is data:mime/type;base64,ENCODED_DATA - we want only ENCODED_DATA
      const base64 = result.split(",")[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error("FileReader failed to produce Base64 data."));
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file); // Reads the file as a data URL (contains base64)
  });
}

/**
 * Helper to decode Base64 back to Blob (use in your application code after getting data)
 * Note: Browser specific. Node would use Buffer.from(..., 'base64')
 */
export function decodeBase64ToFile(base64: string, mimeType: string, fileName: string): File {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  } catch (e) {
    console.error("Failed to decode Base64 string:", e);
    // Return an empty file or throw, depending on desired error handling
    return new File([], fileName, { type: mimeType });
  }
}

export default manager;
