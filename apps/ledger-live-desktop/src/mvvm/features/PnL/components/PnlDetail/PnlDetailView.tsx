import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogBody,
  Button,
} from "@ledgerhq/lumen-ui-react";
import type { PnlDetailItem } from "./usePnlDetailViewModel";
import { PnLinfoDetail } from "./PnLinfoDetail";

type PnlDetailViewProps = {
  title: string;
  description: string;
  items: PnlDetailItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  discreet: boolean;
};

export const PnlDetailView = ({
  title,
  description,
  items,
  isOpen,
  onOpenChange,
  discreet,
}: PnlDetailViewProps) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>
      <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader
        density="expanded"
        title={title}
        description={description}
        onClose={() => onOpenChange(false)}
      />
      <DialogBody>
        {items.map(item => (
          <PnLinfoDetail key={item.title} {...item} discreet={discreet} />
        ))}
      </DialogBody>
    </DialogContent>
  </Dialog>
);
