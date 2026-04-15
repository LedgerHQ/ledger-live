import React, { useCallback, useState } from "react";

type Control = [boolean, React.Dispatch<React.SetStateAction<boolean>>];

function Controlled({
  title,
  children,
  control: [opened, setOpened],
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  control: Control;
}) {
  const onClick = useCallback(() => {
    setOpened(opened => !opened);
  }, [setOpened]);

  return (
    <div className="mt-20 bg-base border border-base rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-8 cursor-pointer heading-5-semi-bold p-16"
        onClick={onClick}
      >
        <span className={`transition-transform ${opened ? "rotate-90" : ""}`}>&#9654;</span>
        <span className="flex-1">{title}</span>
      </div>
      {opened ? <div className="px-16 pb-16">{children}</div> : null}
    </div>
  );
}

export default function Expand({
  title,
  children,
  expanded,
  dynamicControl,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  expanded?: boolean;
  dynamicControl?: Control;
}) {
  const [isOpen, setIsOpen] = useState(expanded ?? false);

  if (dynamicControl) {
    return (
      <Controlled title={title} control={dynamicControl}>
        {children}
      </Controlled>
    );
  }

  return (
    <div className="mt-20 bg-base border border-base rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-8 cursor-pointer heading-5-semi-bold p-16"
        onClick={() => setIsOpen(o => !o)}
      >
        <span className={`transition-transform ${isOpen ? "rotate-90" : ""}`}>&#9654;</span>
        <span className="flex-1">{title}</span>
      </div>
      {isOpen ? <div className="px-16 pb-16">{children}</div> : null}
    </div>
  );
}
