import React, { Suspense } from "react";
import { components } from "../registry";
import { CardSkeleton } from "./CardSkeleton/CardSkeleton.web";

export const Card = () => {
  return (
    <div data-testid="card" className="flex flex-col gap-16">
      {components.map(({ id, Component }) => (
        <Suspense key={id} fallback={<CardSkeleton />}>
          <Component />
        </Suspense>
      ))}
    </div>
  );
};
