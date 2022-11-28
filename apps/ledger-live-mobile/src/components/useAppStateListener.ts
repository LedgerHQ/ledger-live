import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNetInfo } from "@react-native-community/netinfo";
import { syncIsConnected } from "../actions/appstate";

export default function useAppStateListener(): void {
  const dispatch = useDispatch();
  const { isConnected } = useNetInfo();
  useEffect(() => {
    dispatch(syncIsConnected(isConnected));
  }, [dispatch, isConnected]);
}
