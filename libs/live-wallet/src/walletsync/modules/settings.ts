/**
 * @module settings
 *
 * This module is responsible for synchronizing user settings across Live instances
 * in the WalletSync system. It manages the user's selected language and countervalue
 * currency, ensuring that when a user changes these preferences on one Live instance,
 * the change is propagated to all other synchronized Live instances.
 *
 * These settings are local preferences (not stored on the blockchain), and therefore need
 * to be synchronized through the WalletSync system to ensure consistency across all
 * Live instances.
 *
 * Key responsibilities:
 * - Tracks local language and countervalue currency changes and prepares them for synchronization
 * - Resolves incoming settings updates from other Live instances
 * - Handles conflict resolution by accepting incoming state changes (last-write-wins strategy)
 *
 * The module uses a replace-all strategy for updates, meaning any incoming state change
 * will replace the settings. While this simplifies conflict resolution,
 * it may result in lost changes if multiple Live instances modify settings simultaneously.
 */
import { WalletSyncDataManager } from "../types";
import { z } from "zod";

const schema = z.object({
  language: z.string().optional(),
  counterValue: z.string().optional(),
});

type DistantState = z.infer<typeof schema>;

export type SettingsLocalState = {
  language: string;
  counterValue: string;
};

const manager: WalletSyncDataManager<
  SettingsLocalState,
  {
    replaceAll: DistantState;
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    const nextState: DistantState = {
      language: localData.language || undefined,
      counterValue: localData.counterValue || undefined,
    };
    const hasChanges = !sameDistantState(latestState || {}, nextState);
    return {
      hasChanges,
      nextState,
    };
  },

  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    if (!incomingState) {
      return { hasChanges: false };
    }

    const localAsDistant: DistantState = {
      language: localData.language || undefined,
      counterValue: localData.counterValue || undefined,
    };

    const hasChanges =
      latestState !== incomingState && !sameDistantState(localAsDistant, incomingState);

    if (!hasChanges) {
      return { hasChanges: false };
    }

    return {
      hasChanges: true,
      update: { replaceAll: incomingState },
    };
  },

  applyUpdate(localData, update) {
    return {
      language: update.replaceAll.language ?? localData.language,
      counterValue: update.replaceAll.counterValue ?? localData.counterValue,
    };
  },
};

function sameDistantState(a: DistantState, b: DistantState): boolean {
  return a.language === b.language && a.counterValue === b.counterValue;
}

export default manager;
