import { useEffect, useReducer } from "react";
import { getProviders } from "..";
import { AvailableProviderV3 } from "../types";

type State = {
  isLoading: boolean;
  error: Error | null | undefined;
  providers: AvailableProviderV3[] | null | undefined;
};

type ActionType =
  | { type: "SAVE_DATA"; payload: State["providers"] }
  | { type: "SAVE_ERROR"; payload: State["error"] };

const reducer = (_state: State, action: ActionType): State => {
  switch (action.type) {
    case "SAVE_DATA":
      return { error: null, providers: action.payload, isLoading: false };
    case "SAVE_ERROR":
      return { error: action.payload, providers: null, isLoading: false };
    default:
      throw new Error("Uncorrect action type");
  }
};

export const initialState = { isLoading: true, error: null, providers: null };

const filterDisabledProviders = (provider: AvailableProviderV3) =>
  !process.env.SWAP_DISABLED_PROVIDERS?.includes(provider.provider);

export const useSwapProviders = (): State => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isMounted = true;

    const saveProviders = async () => {
      try {
        const allProviders = (await getProviders()) as AvailableProviderV3[];
        const providers = allProviders.filter(filterDisabledProviders);

        if (isMounted) dispatch({ type: "SAVE_DATA", payload: providers });
      } catch (error) {
        if (isMounted && error instanceof Error) dispatch({ type: "SAVE_ERROR", payload: error });
      }
    };

    saveProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
