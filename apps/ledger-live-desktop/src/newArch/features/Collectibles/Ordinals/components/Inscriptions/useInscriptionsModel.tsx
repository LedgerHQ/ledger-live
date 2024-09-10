import { useEffect, useMemo, useState } from "react";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { getInscriptionsData } from "./helpers";
import { InscriptionsItemProps } from "LLD/features/Collectibles/types/Inscriptions";

type Props = {
  inscriptions: SimpleHashNft[];
};

export const useInscriptionsModel = ({ inscriptions }: Props) => {
  const [displayShowMore, setDisplayShowMore] = useState(false);
  const [displayedObjects, setDisplayedObjects] = useState<InscriptionsItemProps[]>([]);

  const items: InscriptionsItemProps[] = useMemo(
    () => getInscriptionsData(inscriptions),
    [inscriptions],
  );

  useEffect(() => {
    if (items.length > 3) setDisplayShowMore(true);
    setDisplayedObjects(items.slice(0, 3));
  }, [items]);

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
