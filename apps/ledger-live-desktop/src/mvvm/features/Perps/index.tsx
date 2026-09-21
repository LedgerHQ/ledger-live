import React from "react";
import { Routes, Route } from "react-router";
import { PerpsApp } from "LLD/features/Perps/screens/PerpsApp";
import Drawer from "~/renderer/drawers/Drawer";

const Perps = () => {
  return (
    <>
      <div className="absolute inset-0 z-20 flex h-screen w-screen flex-col">
        <Routes>
          <Route path="/" element={<PerpsApp />} />
        </Routes>
      </div>
      {/* This route hides the main shell, so setDrawer callers such as
          add-account have no renderer without this. */}
      <Drawer />
    </>
  );
};

export default Perps;
