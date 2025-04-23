import { WalletSyncDataManager } from "../types";
import { z } from "zod";

const messageDescriptorSchema = z.object({
  message: z.string(),
  author: z.string(),
  date: z.date(),
});

export type MessageDescriptor = z.infer<typeof messageDescriptorSchema>;

const schema = z.array(messageDescriptorSchema);

const manager: WalletSyncDataManager<
  { messages: MessageDescriptor[] },
  { messages: MessageDescriptor[] },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    // Use the messages array directly as state
    const nextState = localData.messages;
    const hasChanges = !sameDistantState(
      latestState?.[latestState.length - 1] || {},
      localData.messages[localData.messages.length - 1] || {},
    );
    return {
      hasChanges,
      nextState,
    };
  },

  // NB: current implementation will take any incoming state changes and replace it all.
  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false }; // nothing to do, the data is no longer available
    }

    const hasChanges =
      latestState !== incomingState &&
      !sameDistantState(
        localData.messages[localData.messages.length - 1] || {},
        incomingState[incomingState.length - 1] || {},
      );

    if (!hasChanges) {
      return { hasChanges: false };
    }
    const update = { messages: incomingState };
    return {
      hasChanges: true,
      update,
    };
  },

  applyUpdate(_localData, update) {
    // Return the updated messages array wrapped in an object
    return { messages: update.messages };
  },
};

function sameDistantState(a: Partial<MessageDescriptor>, b: Partial<MessageDescriptor>) {
  return a.author === b.author && a.date === b.date && a.message === b.message;
}

export default manager;
