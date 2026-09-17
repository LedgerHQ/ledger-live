import React from "react";
import AuthPass from "~/context/AuthPass";
import { AppLockGate } from "./AppLockGate";

export function AppLockProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthPass>
      <AppLockGate>{children}</AppLockGate>
    </AuthPass>
  );
}
