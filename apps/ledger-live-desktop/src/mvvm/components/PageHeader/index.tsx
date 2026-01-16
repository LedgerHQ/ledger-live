import React from "react";
import { ArrowLeft } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  title: string;
  onBack: () => void;
};

export default function PageHeader({ title, onBack }: Props) {
  return (
    <div onClick={onBack} className="flex items-center gap-4">
      <ArrowLeft className={"m-10 text-base"} size={20} />
      <span className="heading-3-semi-bold text-base">{title}</span>
    </div>
  );
}
