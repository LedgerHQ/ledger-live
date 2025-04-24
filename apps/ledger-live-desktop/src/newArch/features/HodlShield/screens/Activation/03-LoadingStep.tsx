import React from "react";
import { useSelector } from "react-redux";
import { themeSelector } from "~/renderer/actions/general";
import Loading from "../../components/LoadingStep";

export default function ActivationLoadingStep() {
  const currentTheme = useSelector(themeSelector);

  return (
    <>
      <Loading title="Activating..." subtitle="Setup your Hodl Shield" theme={currentTheme} />
    </>
  );
}
