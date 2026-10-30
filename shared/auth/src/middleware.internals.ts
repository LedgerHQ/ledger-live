import { createAction } from "@reduxjs/toolkit";
import { z } from "zod";
import type { AuthProvider } from "./types";

export const requestAuthProvider = createAction("auth/requestAuthProvider");

export const AuthProviderSchema = z.custom<AuthProvider>(
  value =>
    typeof value === "object" &&
    value !== null &&
    "withToken" in value &&
    typeof value.withToken === "function",
);
