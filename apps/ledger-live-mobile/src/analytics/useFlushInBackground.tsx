import { useEffect } from "react";
import useIsAppInBackground from "../components/useIsAppInBackground";
import { flush } from "./segment";

export default function useFlushInBackground() {
  const isAppInBakcground = useIsAppInBackground();

  useEffect(() => {
    if (isAppInBakcground) {
      flush();
    }
  }, [isAppInBakcground]);
}
