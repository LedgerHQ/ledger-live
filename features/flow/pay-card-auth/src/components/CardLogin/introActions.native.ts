import type { CardLoginIntroAction } from "./types";

export const INTRO_ACTIONS: readonly Omit<CardLoginIntroAction, "label">[] = [
  { id: "createAccount", appearance: "base" },
  { id: "logIn", appearance: "gray" },
];
