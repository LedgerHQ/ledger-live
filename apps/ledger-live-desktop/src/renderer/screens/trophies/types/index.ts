import React from "react";
import { Account } from "@ledgerhq/types-live";

// Trophy interface definition
export interface Trophy {
  id: string;
  title: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  icon: React.ReactElement;
  condition: (accounts: Account[]) => boolean;
  target?: number;
  progress?: (accounts: Account[]) => number;
}

export interface TrophyCategory {
  id: string;
  title: string;
  icon: React.ReactElement;
  trophies: Trophy[];
}

export interface TrophyStats {
  totalTrophies: number;
  earnedCount: number;
  completionRate: number;
  rarityCount: {
    legendary: number;
    rare: number;
    uncommon: number;
    common: number;
  };
}
