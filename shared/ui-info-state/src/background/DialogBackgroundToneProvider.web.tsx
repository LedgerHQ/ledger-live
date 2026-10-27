import React from "react";
import { DialogBackgroundContext } from "./DialogBackgroundContext";
import { DialogBackgroundGradient } from "./DialogBackgroundGradient";
import { useDialogBackgroundToneRequests } from "./useDialogBackgroundToneRequests";

export function DialogBackgroundToneProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { backgroundTone, backgroundContextValue } = useDialogBackgroundToneRequests();

  return (
    <DialogBackgroundContext.Provider value={backgroundContextValue}>
      {backgroundTone ? <DialogBackgroundGradient tone={backgroundTone} /> : null}
      {children}
    </DialogBackgroundContext.Provider>
  );
}
