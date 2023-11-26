import "./live-common-setup";
import App from "./components/App";

const usb = (global?.navigator as { usb?: any })?.usb;

if (usb) {
  usb.addEventListener("connect", console.log.bind(console));
  usb.addEventListener("disconnect", console.log.bind(console));
}

export default App;
