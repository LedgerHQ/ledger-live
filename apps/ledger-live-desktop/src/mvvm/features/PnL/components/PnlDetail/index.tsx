import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody } from "@ledgerhq/lumen-ui-react";
import { PnLinfoDetail } from "./PnLinfoDetail";

export type PnlDetailItem = {
  title: string;
  description: string;
  value: string;
};

export type PnlDetailProps = {
  title: string;
  description: string;
  items: PnlDetailItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const PnlDetail = ({ title, description, items, open, onOpenChange }: PnlDetailProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
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
      </DialogBody>
    </DialogContent>
  </Dialog>
);
