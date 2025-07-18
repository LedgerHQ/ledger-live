import React, { useEffect, useState } from "react";

interface DeferredNetworkRequestsProps {
  children: React.ReactNode;
}

/**
 * Component that handles network requests that should be deferred
 * to avoid blocking the first render of the app
 */
export const DeferredNetworkRequests: React.FC<DeferredNetworkRequestsProps> = ({ children }) => {
  const [shouldMakeRequests, setShouldMakeRequests] = useState(false);

  useEffect(() => {
    // Defer network requests by 2 seconds to allow first render to complete
    const timer = setTimeout(() => {
      setShouldMakeRequests(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything, it just manages the timing
  // The actual network requests are handled by the hooks in the parent component
  // but they can check this state to determine if they should make requests
  return <>{children}</>;
};

export default DeferredNetworkRequests;
