import React from "react";
import LoaderSvg from "./loaderSvg";

import "./index.css";

interface ModalSpinnerProps {
  isReady: boolean;
  becomeGreen: boolean;
}

const ModalSpinner = ({ isReady, becomeGreen }: ModalSpinnerProps) => {
  return (
    <div className="center">
      <div className="blur">
        <div className={isReady && becomeGreen ? "done-animation" : "information-animation"}>
          <LoaderSvg isReady={isReady} />
        </div>
      </div>
    </div>
  );
};
export default ModalSpinner;
