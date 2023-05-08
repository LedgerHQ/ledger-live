import React from "react";
import FTXLogin from "./FTX";

// Component to display a partner login flow
const Login = ({ provider, onClose }: { provider?: string | undefined; onClose: () => void }) => {
  switch (provider) {
    case "ftxus":
    case "ftx":
      return <FTXLogin onClose={onClose} provider={provider} />;
    default:
      return null;
  }
};
export default Login;
