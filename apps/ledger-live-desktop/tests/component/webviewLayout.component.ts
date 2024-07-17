import { Component } from "tests/page/abstractClasses";

export class WebviewLayout extends Component {
  readonly selectedAccountButton = this.page.getByTestId(
    "web-platform-player-topbar-selected-account",
  );
}
