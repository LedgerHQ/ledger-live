import * as React from "react";
import Alert from "./Alert";

type Props = {
  children: React.ReactNode;
};

const WarnBox = ({ children }: Props) => (
  <Alert data-testid="warning-box" type="help" mb={4}>
    {children}
  </Alert>
);
export default WarnBox;
