import React from "react";
import { cn } from "LLD/utils/cn";

type Props = {
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
};

export const AppJsonDropZone = ({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  children,
}: Props) => (
  <div
    className={cn(
      "relative flex min-w-60 cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-12 transition-colors",
      isDragOver ? "border-active bg-muted" : "border-muted bg-transparent",
    )}
    onDragOver={onDragOver}
    onDragLeave={onDragLeave}
    onDrop={onDrop}
  >
    <input
      type="file"
      accept=".json,application/json"
      onChange={onFileChange}
      className="absolute inset-0 cursor-pointer opacity-0"
    />
    {children}
  </div>
);
