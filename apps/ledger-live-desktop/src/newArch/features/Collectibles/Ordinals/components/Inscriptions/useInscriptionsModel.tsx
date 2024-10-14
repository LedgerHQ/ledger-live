import { useEffect, useMemo, useState } from "react";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { getInscriptionsData } from "./helpers";
import { InscriptionsItemProps } from "LLD/features/Collectibles/types/Inscriptions";

type Props = {
  inscriptions: SimpleHashNft[];
  onInscriptionClick: (inscription: SimpleHashNft) => void;
};

export const useInscriptionsModel = ({ inscriptions, onInscriptionClick }: Props) => {
  const items: InscriptionsItemProps[] = useMemo(
    () => getInscriptionsData(inscriptions, onInscriptionClick),
    [inscriptions, onInscriptionClick],
  );

  const initialDisplayedObjects = items.slice(0, 3);
  const initialDisplayShowMore = items.length > 3;

  const [displayShowMore, setDisplayShowMore] = useState(initialDisplayShowMore);
  const [displayedObjects, setDisplayedObjects] =
    useState<InscriptionsItemProps[]>(initialDisplayedObjects);

  useEffect(() => {
    const filteredDisplayedObjects = displayedObjects.filter(displayedObject =>
      items.some(item => item.nftId === displayedObject.nftId),
    );
    if (filteredDisplayedObjects.length !== displayedObjects.length) {
      setDisplayedObjects(items.slice(0, filteredDisplayedObjects.length + 1));
    } else if (displayedObjects.length === 0 && items.length > 3) {
      setDisplayShowMore(true);
      setDisplayedObjects(items.slice(0, 3));
    }
    if (displayedObjects.length === items.length) setDisplayShowMore(false);
  }, [items, displayedObjects]);

  const onShowMore = () => {
    setDisplayedObjects(prevDisplayedObjects => {
      const newDisplayedObjects = [
        ...prevDisplayedObjects,
        ...items.slice(prevDisplayedObjects.length, prevDisplayedObjects.length + 3),
      ];
      if (newDisplayedObjects.length === items.length) setDisplayShowMore(false);
      return newDisplayedObjects;
    });
  };

  return { inscriptions: displayedObjects, displayShowMore, onShowMore };
};
