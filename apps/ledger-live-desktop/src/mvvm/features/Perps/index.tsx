import React from "react";
import { Routes, Route } from "react-router";
import Box from "~/renderer/components/Box";
import { PerpsApp } from "LLD/features/Perps/screens/PerpsApp";

const Perps = () => {
  return (
    <Box className="flex-1">
      <main className="flex flex-1 justify-center">
        <div className="flex w-full">
          <Routes>
            <Route path="/" element={<PerpsApp />} />
          </Routes>
        </div>
      </main>
    </Box>
  );
};

export default Perps;
