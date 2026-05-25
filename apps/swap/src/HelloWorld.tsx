import React, { Suspense } from "react";

const HelloWorldImpl = React.lazy(() => import("./HelloWorld.impl"));

interface HelloWorldProps {
  name?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = props => (
  <Suspense fallback={null}>
    <HelloWorldImpl {...props} />
  </Suspense>
);

export default HelloWorld;
