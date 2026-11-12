import React from "react";

type AgentIntentPlaceholderViewProps = Readonly<{
  title: string;
}>;

export function AgentIntentPlaceholderView({ title }: AgentIntentPlaceholderViewProps) {
  return (
    <div
      className="flex h-full flex-1 items-center justify-center"
      data-testid="agent-intent-placeholder"
    >
      <h1 className="heading-4-semi-bold text-base">{title}</h1>
    </div>
  );
}
