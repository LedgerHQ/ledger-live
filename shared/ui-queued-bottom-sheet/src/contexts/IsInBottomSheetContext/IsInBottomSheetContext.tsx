import React from "react";

const defaultValue = { isInBottomSheet: false };
const valueForBottomSheets = { isInBottomSheet: true };

export const IsInBottomSheetContext = React.createContext<{ isInBottomSheet?: boolean }>(
  defaultValue,
);

export const IsInBottomSheetProvider: React.FC<{ children: React.ReactNode | null }> = ({
  children,
}) => {
  return (
    <IsInBottomSheetContext.Provider value={valueForBottomSheets}>
      {children}
    </IsInBottomSheetContext.Provider>
  );
};
