import React from "react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";
import { cn } from "LLD/utils/cn";

type Props = Readonly<{
  title: string;
  onBack?: () => void;
}>;

export default function PageHeader({ title, onBack }: Props) {
  return (
    <div
      onClick={onBack}
      className={cn("flex items-center gap-4", onBack && "cursor-pointer")}
      data-testid="page-header"
    >
      {onBack ? <ArrowLeft className={"m-10 text-base"} size={20} /> : null}
      <span className="heading-3-semi-bold text-base">{title}</span>
    </div>
  );
}
