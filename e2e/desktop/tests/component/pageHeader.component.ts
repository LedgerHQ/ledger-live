import { Component } from "tests/page/abstractClasses";
import { step } from "tests/misc/reporters/step";

export class PageHeader extends Component {
  readonly root = this.page.getByTestId("page-header");
  readonly backButton = this.root.getByRole("button", { name: "Go back" });

  @step("Click back button in page header")
  async clickBack() {
    await this.backButton.click();
  }
}
