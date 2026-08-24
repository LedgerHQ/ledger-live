import React, { createContext, useContext, useMemo, useRef } from "react";

export type PasswordDraft = Readonly<{
  read: () => string | null;
  write: (password: string) => void;
  clear: () => void;
}>;

const PasswordDraftContext = createContext<PasswordDraft | null>(null);

export function PasswordDraftProvider({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const draft = useRef<string | null>(null);

  const value = useMemo<PasswordDraft>(
    () => ({
      read: () => draft.current,
      write: password => {
        draft.current = password;
      },
      clear: () => {
        draft.current = null;
      },
    }),
    [],
  );

  return <PasswordDraftContext.Provider value={value}>{children}</PasswordDraftContext.Provider>;
}

export function usePasswordDraft(): PasswordDraft {
  const draft = useContext(PasswordDraftContext);

  if (!draft) {
    throw new Error("usePasswordDraft requires a PasswordDraftProvider above it");
  }

  return draft;
}
