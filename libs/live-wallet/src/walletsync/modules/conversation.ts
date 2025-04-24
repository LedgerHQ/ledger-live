import {
  WalletSyncDataManager,
  WalletSyncDataManagerResolutionContext,
  UpdateDiff,
} from "../types.js";
import { z } from "zod";

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

// Document schema for validation
const docSchema = z.object({
  conversation: conversationSchema,
});

export type ConversationDoc = z.infer<typeof docSchema>;

// Local data is just the plain JS object
type LocalDataType = ConversationDoc;

// We’ll serialize to JSON strings
type SerializedDoc = string;
type DistantStateType = SerializedDoc | null;
type UpdateType = SerializedDoc | null;

// Simple deep-equal via JSON (only safe here because our data is JSON-safe and property order is stable)
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Merge two message arrays, deduplicating by author+date+message
function mergeMessages(a: MessageDescriptor[], b: MessageDescriptor[]): MessageDescriptor[] {
  const map = new Map<string, MessageDescriptor>();
  for (const msg of [...a, ...b]) {
    const key = `${msg.author}::${msg.date}::${msg.message}`;
    if (!map.has(key)) map.set(key, msg);
  }
  return Array.from(map.values());
}

const manager: WalletSyncDataManager<
  LocalDataType,
  UpdateType,
  typeof docSchema,
  DistantStateType
> = {
  schema: docSchema,

  diffLocalToDistant(localDataDoc, latestStateSerialized) {
    // Serialize current local doc
    const localJSON = JSON.stringify(localDataDoc);

    if (!latestStateSerialized) {
      // Nothing on server yet
      return { hasChanges: true, nextState: localJSON };
    }

    // Compare serialized copies
    if (localJSON !== latestStateSerialized) {
      return { hasChanges: true, nextState: localJSON };
    } else {
      return { hasChanges: false, nextState: null };
    }
  },

  async resolveIncrementalUpdate(
    _ctx: WalletSyncDataManagerResolutionContext,
    localDataDoc,
    latestStateSerialized,
    incomingStateSerialized,
  ): Promise<UpdateDiff<UpdateType>> {
    if (!incomingStateSerialized) {
      return { hasChanges: false };
    }

    // Parse incoming
    let incomingDoc: ConversationDoc;
    try {
      incomingDoc = JSON.parse(incomingStateSerialized);
    } catch (e) {
      console.error("Failed to parse incoming state:", e);
      return { hasChanges: false };
    }

    // Validate shape
    const parsed = docSchema.safeParse(incomingDoc);
    if (!parsed.success) {
      console.error("Incoming validation failed:", parsed.error);
      return { hasChanges: false };
    }

    // Merge only the messages (id and name assumed stable)
    const localConv = localDataDoc.conversation;
    const incomingConv = incomingDoc.conversation;

    if (localConv.id !== incomingConv.id) {
      console.warn("Mismatched conversation IDs!");
      // fall back to incoming
      return { hasChanges: true, update: incomingStateSerialized };
    }

    const mergedMessages = mergeMessages(localConv.messages, incomingConv.messages);

    const mergedDoc: ConversationDoc = {
      conversation: {
        id: localConv.id,
        name: localConv.name,
        messages: mergedMessages,
      },
    };

    // If nothing changed, bail
    if (deepEqual(localDataDoc, mergedDoc)) {
      return { hasChanges: false };
    }

    // Otherwise return the full merged state
    const mergedJSON = JSON.stringify(mergedDoc);
    return { hasChanges: true, update: mergedJSON };
  },

  applyUpdate(_localDataDoc, updateDoc) {
    if (!updateDoc) {
      throw new Error("applyUpdate received a null updateDoc");
    }
    return JSON.parse(updateDoc) as ConversationDoc;
  },
};

/**
 * Add a message to the conversation locally (immutably).
 */
export function addMessageToDoc(
  currentDoc: ConversationDoc,
  message: string,
  author: string,
): ConversationDoc {
  return {
    conversation: {
      ...currentDoc.conversation,
      messages: [
        ...currentDoc.conversation.messages,
        {
          message,
          author,
          date: Date.now(),
        },
      ],
    },
  };
}

/**
 * Initialize a new conversation document.
 */
export function createInitialDoc(id: string, name: string): ConversationDoc {
  return {
    conversation: {
      id,
      name,
      messages: [],
    },
  };
}

/**
 * Extract and sort messages for display.
 */
export function getSortedMessages(doc: ConversationDoc): MessageDescriptor[] {
  return [...doc.conversation.messages].sort((a, b) => a.date - b.date);
}

export default manager;
