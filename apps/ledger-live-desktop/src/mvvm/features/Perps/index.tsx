import React from "react";
import { Routes, Route } from "react-router";
import { PerpsApp } from "LLD/features/Perps/screens/PerpsApp";

const Perps = () => {
  return (
    <div className="absolute inset-0 z-20 flex h-screen w-screen flex-col">
      <Routes>
        <Route path="/" element={<PerpsApp />} />
      </Routes>
    </div>
  );
};

export default Perps;
