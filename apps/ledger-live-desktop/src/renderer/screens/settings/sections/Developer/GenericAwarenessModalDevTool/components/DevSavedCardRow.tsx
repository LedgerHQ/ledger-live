import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { COPY } from "../utils/copy";

type DevSavedCardRowProps = {
  id: string;
  layout: GenericAwarenessModalLayout;
  onRemove: () => void;
};

const LAYOUT_LABEL: Record<GenericAwarenessModalLayout, string> = {
  [GenericAwarenessModalLayout.Carousel]: COPY.layoutCarousel,
  [GenericAwarenessModalLayout.FeatureIntro]: COPY.layoutFeatureIntro,
  [GenericAwarenessModalLayout.Prompt]: COPY.layoutPrompt,
};

export const DevSavedCardRow = ({ id, layout, onRemove }: DevSavedCardRowProps) => (
  <li className="flex flex-row flex-wrap items-center justify-between gap-4 rounded-md border border-muted-subtle bg-canvas p-8">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="body-3 font-mono text-muted">{id}</span>
      <span className={`body-3-semi-bold w-fit rounded-full px-2.5 py-0.5`}>
        {LAYOUT_LABEL[layout]}
      </span>
    </div>
    <Button size="sm" appearance="red" onClick={onRemove}>
      {COPY.removeCard}
    </Button>
  </li>
);
