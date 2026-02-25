import React from "react";
import BigSpinner from "~/renderer/components/BigSpinner";

interface PerpsLoaderProps {
  isLoading: boolean;
}

export function PerpsLoader({ isLoading }: Readonly<PerpsLoaderProps>) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <BigSpinner size={50} />
    </div>
  );
}
