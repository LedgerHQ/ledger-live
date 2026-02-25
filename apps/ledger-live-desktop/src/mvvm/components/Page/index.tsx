import React from "react";
import { usePageViewModel } from "./usePageViewModel";
import { PageView } from "./PageView";

interface PageProps {
  children: React.ReactNode;
}

/**
 * Page component - Main content wrapper for the application
 * Handles scroll behavior, layout switching between classic and Wallet 4.0
 *
 * Follows MVVM pattern: Container → ViewModel → View
 */
const Page = ({ children }: PageProps) => {
  const viewModel = usePageViewModel();

  return <PageView {...viewModel}>{children}</PageView>;
};

export default Page;

// Re-export utilities for backward compatibility
export { getPagePaddingLeft, getPagePaddingRight } from "./components";
