import React, { useState, useEffect } from "react";
import { View } from "react-native";

interface LazyComponentProps {
  children: React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

/**
 * Component that defers rendering of heavy components to improve startup time
 */
export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  delay = 1000,
  fallback = null,
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default LazyComponent;
