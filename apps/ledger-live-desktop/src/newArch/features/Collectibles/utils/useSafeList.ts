import { ContextMenuItemType } from "~/renderer/components/ContextMenu/ContextMenuWrapper";

export function safeList(items: (ContextMenuItemType | "" | undefined)[]): ContextMenuItemType[] {
  return items.filter(Boolean) as ContextMenuItemType[];
}
