import React from "react";

const IsInDrawerContext = React.createContext<{ isInDrawer?: boolean }>({ isInDrawer: false });

export default IsInDrawerContext;
