import { Component } from "tests/page/abstractClasses";

export class AppUpdater extends Component {
  async setStatus(s: UpdateStatus) {
    await this.page.evaluate(
      args => {
        [s] = args;
        if (window && window.mock && window.mock.updater && window.mock.updater.setStatus) {
          window?.mock?.updater?.setStatus(s);
        }
      },
      [s],
    );
  }
}
