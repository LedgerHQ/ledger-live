import React, { createContext, useCallback, useContext, useState } from "react";
import { ChevronRight } from "@ledgerhq/lumen-ui-react/symbols";

type Control = [boolean, React.Dispatch<React.SetStateAction<boolean>>];

// Sections are separated by surface and spacing rather than borders: top-level ones are cards
// on a slightly lighter surface, nested ones are plain rows set apart by a larger gap.
const ExpandDepthContext = createContext(0);

function Panel({
  title,
  children,
  opened,
  onToggle,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  opened: boolean;
  onToggle: () => void;
}) {
  const depth = useContext(ExpandDepthContext);
  const isNested = depth > 0;

  return (
    <section className={isNested ? "mt-24" : "mt-16 rounded-lg bg-surface"}>
      <button
        type="button"
        aria-expanded={opened}
        onClick={onToggle}
        className={`flex w-full cursor-pointer items-center gap-12 text-left text-base hover:bg-muted ${
          isNested ? "body-2-semi-bold rounded-md px-8 py-8" : "heading-5-semi-bold rounded-lg p-16"
        }`}
      >
        <ChevronRight
          size={isNested ? 16 : 20}
          className={`shrink-0 text-muted transition-transform ${opened ? "rotate-90" : ""}`}
        />
        <span className="flex flex-1 flex-wrap items-center gap-x-12 gap-y-4">{title}</span>
      </button>
      {opened ? (
        <ExpandDepthContext.Provider value={depth + 1}>
          <div className={isNested ? "px-8 pb-8" : "px-16 pb-24 pt-8"}>{children}</div>
        </ExpandDepthContext.Provider>
      ) : null}
    </section>
  );
}

function Controlled({
  title,
  children,
  control: [opened, setOpened],
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  control: Control;
}) {
  const onToggle = useCallback(() => {
    setOpened(opened => !opened);
  }, [setOpened]);

  return (
    <Panel title={title} opened={opened} onToggle={onToggle}>
      {children}
    </Panel>
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
  const onToggle = useCallback(() => setIsOpen(o => !o), []);

  if (dynamicControl) {
    return (
      <Controlled title={title} control={dynamicControl}>
        {children}
      </Controlled>
    );
  }

  return (
    <Panel title={title} opened={isOpen} onToggle={onToggle}>
      {children}
    </Panel>
  );
}
