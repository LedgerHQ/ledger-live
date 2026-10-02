import { usePayCardFace } from "./usePayCardFace";

export const useCardVisibility = (): boolean => {
  const face = usePayCardFace();

  return face === "native" || face === "liveApp";
};
