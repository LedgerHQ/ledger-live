import { UseSwapLiveAppDemo0Props, useSwapLiveAppDemo0 } from "./useSwapLiveAppDemo0";
import { UseSwapLiveAppDemo1Props, useSwapLiveAppDemo1 } from "./useSwapLiveAppDemo1";

export type UseSwapLiveAppHookProps = UseSwapLiveAppDemo0Props & UseSwapLiveAppDemo1Props;

export const useSwapLiveAppHook = (props: UseSwapLiveAppDemo1Props) => {
  useSwapLiveAppDemo0(props);
  useSwapLiveAppDemo1(props);
};
