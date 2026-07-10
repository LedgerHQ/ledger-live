import type { PlaygroundViewProps } from "./types";

export function PlaygroundView({ title, description }: PlaygroundViewProps) {
  return (
    <div className="flex flex-col gap-8 rounded-lg bg-canvas-muted p-16">
      <span className="heading-4 font-semibold text-base">{title}</span>
      <span className="body-2 text-muted">{description}</span>
    </div>
  );
}
