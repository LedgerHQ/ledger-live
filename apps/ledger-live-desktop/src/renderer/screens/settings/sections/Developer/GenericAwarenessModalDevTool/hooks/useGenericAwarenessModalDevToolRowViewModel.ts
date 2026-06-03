import { useCallback } from "react";
import { useNavigate } from "react-router";

export const useGenericAwarenessModalDevToolRowViewModel = () => {
  const navigate = useNavigate();

  const onOpen = useCallback(() => {
    navigate("/settings/developer/generic-awareness-modal-qa");
  }, [navigate]);

  return { onOpen };
};
