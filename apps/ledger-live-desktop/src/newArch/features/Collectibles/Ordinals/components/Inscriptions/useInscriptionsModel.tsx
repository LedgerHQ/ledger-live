import { useEffect, useMemo, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { InscriptionsItemProps } from "./index";
import { mockedItems as InscriptionsMocked } from "LLD/features/Collectibles/__integration__/mockedInscriptions";
type Props = {
  account: Account;
};

export const useInscriptionsModel = ({ account }: Props) => {
  const [displayShowMore, setDisplayShowMore] = useState(false);
  const [displayedObjects, setDisplayedObjects] = useState<InscriptionsItemProps[]>([]);

  const mockedItems: InscriptionsItemProps[] = useMemo(() => [...InscriptionsMocked], []);

  useEffect(() => {
    if (mockedItems.length > 3) setDisplayShowMore(true);
    setDisplayedObjects(mockedItems.slice(0, 3));
  }, [mockedItems]);

  const onShowMore = () => {
    setDisplayedObjects(prevDisplayedObjects => {
      const newDisplayedObjects = [
        ...prevDisplayedObjects,
        ...mockedItems.slice(prevDisplayedObjects.length, prevDisplayedObjects.length + 3),
      ];
      if (newDisplayedObjects.length === mockedItems.length) setDisplayShowMore(false);
      return newDisplayedObjects;
    });
  };

  return { account, displayedObjects, displayShowMore, onShowMore };
};
