import React from "react";
import Spinner from "~/renderer/components/Spinner";

export function SkeletonLoader() {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
