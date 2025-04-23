import {
  WalletSyncDataManager,
  WalletSyncDataManagerResolutionContext,
  UpdateDiff,
} from "../types.js.js";
import { z } from "zod";
import * as Automerge from "@automerge/automerge";

// Message structure
const messageDescriptorSchema = z.object({
  message: z.string(),
  author: z.string(),
  date: z.number(), // Unix timestamp
});

export type MessageDescriptor = z.infer<typeof messageDescriptorSchema>;

// Conversation structure
const conversationSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(messageDescriptorSchema),
});

export type Conversation = z.infer<typeof conversationSchema>;

// Automerge document structure
interface ConversationDoc {
  conversation: Conversation;
}

// Zod schema for validating the conversation content
const docSchema = z.object({
  conversation: conversationSchema,
});

// Local state is an Automerge document
type LocalDataType = Automerge.Doc<ConversationDoc>;

// Serialized Automerge document (Uint8Array)
type SerializedAutomergeDoc = Uint8Array;

// Distant state is the serialized document or null
type DistantStateType = SerializedAutomergeDoc | null;

// Update is also the serialized document or null
type UpdateType = SerializedAutomergeDoc | null;

const manager: WalletSyncDataManager<
  LocalDataType,
  UpdateType,
  typeof docSchema,
  DistantStateType
> = {
  schema: docSchema,

  /**
   * Compare local state with the latest distant state to determine if updates need to be pushed.
   */
  diffLocalToDistant(localDataDoc: LocalDataType, latestStateSerialized: DistantStateType) {
    let latestStateDoc: LocalDataType | null = null;
    if (latestStateSerialized) {
      try {
        latestStateDoc = Automerge.load<ConversationDoc>(latestStateSerialized);
      } catch (e) {
        console.error("Failed to load latestState for diffing:", e);
        return {
          hasChanges: true,
          nextState: Automerge.save(localDataDoc),
        };
      }
    }

    // If no latest state, treat it as an empty doc
    const baseDoc = latestStateDoc || Automerge.init<ConversationDoc>();
    const changes = Automerge.getChanges(baseDoc, localDataDoc);
    const hasChanges = changes.length > 0;

    return {
      hasChanges,
      nextState: hasChanges ? Automerge.save(localDataDoc) : null,
    };
  },

  /**
   * Merge incoming distant state with local state and determine the update.
   */
  async resolveIncrementalUpdate(
    _ctx: WalletSyncDataManagerResolutionContext,
    localDataDoc: LocalDataType,
    latestStateSerialized: DistantStateType,
    incomingStateSerialized: DistantStateType,
  ): Promise<UpdateDiff<UpdateType>> {
    if (!incomingStateSerialized) {
      return { hasChanges: false };
    }

    let incomingDoc: LocalDataType;
    try {
      incomingDoc = Automerge.load<ConversationDoc>(incomingStateSerialized);
    } catch (e) {
      console.error("Failed to load incoming state:", e);
      return { hasChanges: false };
    }

    // Optional: Validate incoming data
    const validation = docSchema.safeParse(incomingDoc);
    if (!validation.success) {
      console.error("Incoming document validation failed:", validation.error);
      return { hasChanges: false };
    }

    // Merge local and incoming documents
    const mergedDoc = Automerge.merge(Automerge.clone(localDataDoc), incomingDoc);

    // Check if there are actual changes
    const localSaved = Automerge.save(localDataDoc);
    const mergedSaved = Automerge.save(mergedDoc);
    const hasChanges = !arrayBuffersEqual(localSaved, mergedSaved);

    return hasChanges ? { hasChanges: true, update: mergedSaved } : { hasChanges: false };
  },

  /**
   * Apply the update to the local state.
   */
  applyUpdate(_localDataDoc: LocalDataType, updateDoc: UpdateType): LocalDataType {
    if (!updateDoc) {
      throw new Error("applyUpdate received a null updateDoc");
    }
    return Automerge.load<ConversationDoc>(updateDoc);
  },
};

// Helper to compare Uint8Arrays
function arrayBuffersEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((byte, i) => byte === b[i]);
}

/**
 * Add a message to the conversation locally.
 */
export function addMessageToDoc(
  currentDoc: LocalDataType,
  message: string,
  author: string,
): LocalDataType {
  return Automerge.change(currentDoc, "addMessage", doc => {
    if (!doc.conversation.messages) {
      doc.conversation.messages = [];
    }
    doc.conversation.messages.push({
      message,
      author,
      date: Date.now(),
    });
  });
}

/**
 * Initialize a new conversation document.
 */
export function createInitialDoc(id: string, name: string): LocalDataType {
  const doc = Automerge.init<ConversationDoc>();
  return Automerge.change(doc, "initConversation", doc => {
    doc.conversation = {
      id,
      name,
      messages: [],
    };
  });
}

/**
 * Extract and sort messages for display.
 */
export function getSortedMessages(doc: LocalDataType): MessageDescriptor[] {
  const messages = doc.conversation.messages || [];
  return [...messages].sort((a, b) => a.date - b.date);
}

export default manager;
