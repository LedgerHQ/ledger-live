import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import { PnLinfoDetail } from "./PnLinfoDetail";
import TrackPage from "~/renderer/analytics/TrackPage";

export type PnlDetailItem = {
  title: string;
  description: string;
  value: string;
};

export type PnlDetailProps = {
  title: string;
  description: string;
  items: PnlDetailItem[];
  disclaimer: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PnlDetail = ({
  title,
  description,
  items,
  disclaimer,
  open,
  onOpenChange,
}: PnlDetailProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    {open ? <TrackPage category="Detailed PnL" refreshSource={false} /> : null}
    <DialogContent>
      <DialogHeader
        density="expanded"
        title={title}
        description={description}
        onClose={() => onOpenChange(false)}
      />
      <DialogBody>
        {items.map(item => (
          <PnLinfoDetail key={item.title} {...item} />
        ))}
        <p className="body-4 text-muted mt-8">{disclaimer}</p>
      </DialogBody>
    </DialogContent>
  </Dialog>
);
