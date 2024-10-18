import { useCallback, useEffect, useState } from "react";

export default function useConnectViewModel() {
  const [isOpened, setIsOpened] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {}, [isEnabled]);

  const onConnect = useCallback(() => {
    setIsEnabled(true);
    setIsOpened(false);
  }, []);

  const onClose = useCallback(() => {
    setIsOpened(false);
    setIsEnabled(false);
  }, []);

  return {
    isEnabled,
    isOpened,
    onConnect,
    onClose,
  };
}
