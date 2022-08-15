// @flow
import React, { useEffect } from "react";

const DebugSpeculos = () => {
  useEffect(() => {
    const webview = document.getElementById("speculos");

    webview.addEventListener("dom-ready", () => {
      webview.insertCSS(
        "html{ overflow: hidden !important;} div.infos,div.footer,div.buttons {display: none; !important};",
      );
    });
  });

  return (
    <webview
      id="speculos"
      src={`http://localhost:${process.env.SPECULOS_API_PORT}#screenshot`}
      style={{ display: "inline-flex", width: "296px", height: "84px" }}
    />
  );
};

export default DebugSpeculos;
