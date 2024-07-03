import React, { useEffect, useRef, useCallback } from "react";
import invariant from "invariant";
import {
  withContextMenuContext,
  ContextMenuItemType,
  ContextType,
} from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import { track } from "~/renderer/analytics/segment";

const DISABLE_CONTEXT_MENU = Boolean(process.env.DISABLE_CONTEXT_MENU);

interface InnerProps {
  children?: React.ReactNode;
  leftClick?: boolean;
  items: ContextMenuItemType[];
  event?: string;
  eventProperties?: Record<string, unknown>;
}

interface Props extends InnerProps {
  context: ContextType;
}

const ContextMenuItem: React.FC<Props> = ({
  children,
  leftClick,
  items,
  event,
  eventProperties,
  context,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const showContextMenu = useCallback(
    (e: MouseEvent) => {
      if (event) track(event, eventProperties);
      context.showContextMenu(e, items);
      e.preventDefault();
      e.stopPropagation();
    },
    [context, event, eventProperties, items],
  );

  useEffect(() => {
    invariant(items, "Don't wrap with ContextMenuWrapper without providing items");
    const currentRef = ref.current;
    if (currentRef) {
      if (leftClick) currentRef.addEventListener("click", showContextMenu);
      else if (!DISABLE_CONTEXT_MENU) currentRef.addEventListener("contextmenu", showContextMenu);

      return () => {
        if (leftClick) currentRef.removeEventListener("click", showContextMenu);
        else if (!DISABLE_CONTEXT_MENU)
          currentRef.removeEventListener("contextmenu", showContextMenu);
      };
    }
  }, [leftClick, showContextMenu, items]);

  return <div ref={ref}>{children}</div>;
};

export default withContextMenuContext<InnerProps>(ContextMenuItem);
