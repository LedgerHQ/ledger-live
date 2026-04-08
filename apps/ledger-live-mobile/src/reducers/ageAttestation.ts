import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AgeAttestationLocalState } from "@ledgerhq/live-wallet/walletsync/modules/ageAttestation";
import type { State } from "./types";

export type { AgeAttestationLocalState };

const initialState: AgeAttestationLocalState = {
  verified: false,
  proof: null,
  publicSignals: null,
  minimumAge: null,
  verifiedAt: null,
  proofHash: null,
};

const ageAttestationSlice = createSlice({
  name: "ageAttestation",
  initialState,
  reducers: {
    setAgeAttestation: (_, action: PayloadAction<AgeAttestationLocalState>) => action.payload,
    resetAgeAttestation: () => initialState,
  },
});

export const { setAgeAttestation, resetAgeAttestation } = ageAttestationSlice.actions;

export const ageAttestationSelector = (state: State): AgeAttestationLocalState =>
  state.ageAttestation;
export const isAgeVerifiedSelector = (state: State): boolean => state.ageAttestation.verified;

export default ageAttestationSlice.reducer;
