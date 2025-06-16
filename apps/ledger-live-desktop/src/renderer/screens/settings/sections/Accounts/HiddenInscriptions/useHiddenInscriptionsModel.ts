import { useCallback, useState } from "react";
import { useHideInscriptions } from "LLD/features/Collectibles/hooks/useHideInscriptions";

const useHiddenInscriptionsModel = () => {
  const { hiddenOrdinalAssets, unHideInscription } = useHideInscriptions();
  const [sectionVisible, setSectionVisible] = useState(false);

  const toggleCurrencySection = useCallback(() => {
    setSectionVisible(prevState => !prevState);
  }, [setSectionVisible]);

  return {
    hiddenOrdinalAssets,
    sectionVisible,
    unHideInscription,
    toggleCurrencySection,
  };
};

export default useHiddenInscriptionsModel;
