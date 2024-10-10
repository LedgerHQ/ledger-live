import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAtom } from "jotai";
import { createJSONStorage } from "jotai/utils";
import { useCallback, useMemo } from "react";
import { Web3HubDB } from "LLM/features/Web3Hub/types";
import { atomWithStorage } from "jotai/utils";
import { INITIAL_WEB3HUB_STATE, WEB3HUB_STORE_KEY } from "./constants";

export const storage = createJSONStorage<Web3HubDB>(() => AsyncStorage);

export const web3hubAtom = atomWithStorage<Web3HubDB>(
  WEB3HUB_STORE_KEY,
  INITIAL_WEB3HUB_STATE,
  storage,
);

type NewState = Web3HubDB | ((s: Web3HubDB) => Web3HubDB);

export function useWeb3HubDB<Selected>(
  selector: (state: Web3HubDB) => Selected,
): [Selected, (v: NewState) => void] {
  const [state, setState] = useAtom(web3hubAtom);

  const setter = useCallback(
    (newState: NewState) => {
      const val = typeof newState === "function" ? newState(state) : newState;

      setState(val);
    },
    // eslint-disable-next-line
    [state],
  );

  const result = useMemo(() => selector(state), [state, selector]);
  return [result, setter];
}
