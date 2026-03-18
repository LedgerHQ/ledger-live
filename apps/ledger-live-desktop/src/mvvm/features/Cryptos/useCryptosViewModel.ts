import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { CryptosViewModel } from "./types";

export default function useCryptosViewModel(): CryptosViewModel {
  const navigate = useNavigate();

  const navigateToDashboard = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    navigateToDashboard,
  };
}
