import { useState, type ReactNode } from "react";

export function Expand({
  title,
  children,
  defaultExpanded = false,
}: Readonly<{
  title: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}>) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <div className="mt-20 bg-base border border-base rounded-lg overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-8 cursor-pointer heading-5-semi-bold p-16 text-left"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>&#9654;</span>
        <span className="flex-1">{title}</span>
      </button>
      {open ? <div className="px-16 pb-16">{children}</div> : null}
    </div>
  );
}
