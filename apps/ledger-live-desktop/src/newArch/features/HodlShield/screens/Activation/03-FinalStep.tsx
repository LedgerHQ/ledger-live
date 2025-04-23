import React from "react";
import { Success } from "../../components/Success";
import { useDispatch } from "react-redux";
import { setDrawerVisibility } from "~/renderer/actions/hodlShield";
import { setHodlShieldActivted } from "~/renderer/actions/settings";

export default function ActivationFinalStep() {
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(setHodlShieldActivted);
    dispatch(setDrawerVisibility(false));
  };

  return (
    <Success
      title="Hodl Shield success"
      description="Your Hodl Shield is now activated."
      withCta
      withClose
      onClick={onClose}
    />
  );
}
