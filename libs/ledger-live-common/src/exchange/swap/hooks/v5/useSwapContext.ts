import { useContext } from "react";
import { SwapContext } from "../../context/v5/SwapContext";

export function useSwapContext() {
  const context = useContext(SwapContext);
  return context;
}
