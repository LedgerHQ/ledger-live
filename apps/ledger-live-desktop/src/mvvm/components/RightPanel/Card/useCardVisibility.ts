import { usePayCardFace } from "./usePayCardFace";

export const useCardVisibility = (): boolean => usePayCardFace() === "native";
