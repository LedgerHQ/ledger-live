import * as React from "react";
import Alert from "./Alert";
type Props = {
  style?: any;
  children: React.Node;
};
const WarnBox = ({ children }: Props) => (
  <Alert type="help" mb={4}>
    {children}
  </Alert>
);
export default WarnBox;
