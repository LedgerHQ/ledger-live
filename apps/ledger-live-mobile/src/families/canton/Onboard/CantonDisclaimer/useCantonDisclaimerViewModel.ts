import { useCallback, useState } from "react";

export function useCantonDisclaimerViewModel() {
  const [agreed, setAgreed] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleToggleAgreed = useCallback(() => setAgreed(prev => !prev), []);
  const handleOpenTerms = useCallback(() => setIsTermsOpen(true), []);
  const handleCloseTerms = useCallback(() => setIsTermsOpen(false), []);

  return {
    agreed,
    isTermsOpen,
    handleToggleAgreed,
    handleOpenTerms,
    handleCloseTerms,
  };
}
