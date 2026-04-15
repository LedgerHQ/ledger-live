import React from "react";
import { IdentityView } from "./IdentityView";
import { useIdentityViewModel } from "./useIdentityViewModel";

const Identity = () => <IdentityView {...useIdentityViewModel()} />;

export default Identity;
