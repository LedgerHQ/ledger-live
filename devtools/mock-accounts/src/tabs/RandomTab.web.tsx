import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";

const PICKS = ["1", "2", "5", "10", "25", "50", "100"] as const;

interface Props {
  onGenerate: (count: number) => void;
}

export function RandomTab({ onGenerate }: Props) {
  return (
    <div className="flex flex-wrap gap-8 pt-4">
      {PICKS.map(n => (
        <Button key={n} appearance="gray" size="sm" onClick={() => onGenerate(Number(n))}>
          {n}
        </Button>
      ))}
    </div>
  );
}
