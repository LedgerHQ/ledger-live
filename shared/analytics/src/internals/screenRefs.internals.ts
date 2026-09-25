let currentPage: string | null | undefined = null;
let previousPage: string | null | undefined = null;

export const getCurrentTrackingPageValue = (): string | null | undefined => currentPage;

export const getPreviousTrackingPageValue = (): string | null | undefined => previousPage;

export const setCurrentTrackingPage = (source?: string): void => {
  currentPage = source;
};

export const updateTrackingPages = (page: string, refreshSource: boolean): void => {
  previousPage = currentPage;
  if (refreshSource) {
    currentPage = page;
  }
};

export const resetTrackingPageValues = (): void => {
  currentPage = null;
  previousPage = null;
};
