import "../live-common-setup";
import App from "./components/App";
import { Provider } from "react-redux";
import { store } from "./store";

export default function V4AccountModelPlayground() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}
