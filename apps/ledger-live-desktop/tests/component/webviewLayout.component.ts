import { Component } from "tests/page/abstractClasses";

export class WebviewLayout extends Component {
  readonly selectedAccountButton = this.page.locator(
    '[data-test-id="web-platform-player-topbar-selected-account"]',
  );
}
