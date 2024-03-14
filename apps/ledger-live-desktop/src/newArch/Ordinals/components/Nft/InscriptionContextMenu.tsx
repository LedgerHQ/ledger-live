import React from "react";
import ContextMenuItem from "~/renderer/components/ContextMenu/ContextMenuItem";

import { Ordinal } from "../../types/Ordinals";
import useAdditionalActions from "../../hooks/useAdditionalActions";

type Props = {
  inscription: Ordinal;
  leftClick?: boolean;
  children: React.ReactNode;
};
export default function InscriptionContextMenu({ inscription, leftClick, children }: Props) {
  const { menuItems } = useAdditionalActions(inscription);
  return (
    <ContextMenuItem
      event={"Inscription right click"}
      eventProperties={{
        currencyName: inscription.name,
      }}
      leftClick={leftClick}
      items={menuItems}
    >
      {children}
    </ContextMenuItem>
  );
}
