import React from "react";
import { Subheader, SubheaderDescription, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { CardLogin } from "../../components/CardLogin";
import type { CardScreenViewModel } from "./useCardScreenViewModel";

type CardScreenViewProps = CardScreenViewModel;

export function CardScreenView({ description, title }: CardScreenViewProps) {
  return (
    <Subheader>
      <div className="flex w-full items-center gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <SubheaderTitle as="h2" className="heading-5-semi-bold">
            {title}
          </SubheaderTitle>
          <SubheaderDescription className="body-2 text-muted">{description}</SubheaderDescription>
        </div>
        <CardLogin />
      </div>
    </Subheader>
  );
}
