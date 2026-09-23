import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import type { ListReorderOptions, ListReorderState } from "./types";

type HandleProps = Readonly<{
  "aria-pressed": boolean;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onPointerDown: () => void;
}>;

type RowProps = Readonly<{
  "data-list-reorder-id": string;
  draggable: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}>;

export type ListReorderBindings = ListReorderState &
  Readonly<{
    getHandleProps: (id: string) => HandleProps;
    getRowProps: (id: string) => RowProps;
  }>;

function getRows(element: HTMLElement): HTMLElement[] {
  const container = element.closest<HTMLElement>("[data-list-reorder-id]")?.parentElement;
  return container
    ? Array.from(container.querySelectorAll<HTMLElement>(":scope > [data-list-reorder-id]"))
    : [];
}

export function useListReorder({
  onMove,
  disabled = false,
}: ListReorderOptions): ListReorderBindings {
  const armedId = useRef<string | null>(null);
  const draggedId = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [keyboardPickedUpId, setKeyboardPickedUpId] = useState<string | null>(null);

  const move = useCallback(
    (id: string, toIndex: number) => {
      onMove(id, toIndex);
      setAnnouncement(`Moved item to position ${toIndex + 1}.`);
    },
    [onMove],
  );

  const getHandleProps = useCallback(
    (id: string): HandleProps => ({
      "aria-pressed": keyboardPickedUpId === id,
      onPointerDown: () => {
        if (!disabled) armedId.current = id;
      },
      onKeyDown: event => {
        if (disabled) return;

        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          setKeyboardPickedUpId(current => (current === id ? null : id));
          setAnnouncement(keyboardPickedUpId === id ? "Item dropped." : "Item picked up.");
          return;
        }

        if (keyboardPickedUpId !== id) return;
        if (event.key === "Escape") {
          event.preventDefault();
          setKeyboardPickedUpId(null);
          setAnnouncement("Reorder cancelled.");
          return;
        }

        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        const rows = getRows(event.currentTarget);
        const currentIndex = rows.findIndex(row => row.dataset.listReorderId === id);
        const offset = event.key === "ArrowUp" ? -1 : 1;
        const toIndex = Math.max(0, Math.min(rows.length - 1, currentIndex + offset));
        if (currentIndex >= 0 && currentIndex !== toIndex) move(id, toIndex);
      },
    }),
    [disabled, keyboardPickedUpId, move],
  );

  const getRowProps = useCallback(
    (id: string): RowProps => ({
      "data-list-reorder-id": id,
      draggable: !disabled,
      onDragStart: event => {
        if (disabled || armedId.current !== id) {
          event.preventDefault();
          return;
        }
        draggedId.current = id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      },
      onDragEnd: () => {
        armedId.current = null;
        draggedId.current = null;
      },
      onDragOver: event => {
        if (draggedId.current) event.preventDefault();
      },
      onDrop: event => {
        event.preventDefault();
        const dragged = draggedId.current ?? event.dataTransfer.getData("text/plain");
        const rows = getRows(event.currentTarget);
        const toIndex = rows.findIndex(row => row.dataset.listReorderId === id);
        if (dragged && toIndex >= 0 && dragged !== id) move(dragged, toIndex);
        armedId.current = null;
        draggedId.current = null;
      },
    }),
    [disabled, move],
  );

  return { getHandleProps, getRowProps, announcement, keyboardPickedUpId };
}
