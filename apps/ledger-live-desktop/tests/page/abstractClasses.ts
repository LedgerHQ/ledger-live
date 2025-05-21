import { Page } from "@playwright/test";
export abstract class PageHolder {
  constructor(protected page: Page) {}
}

export abstract class Component extends PageHolder {}

export abstract class AppPage extends Component {}
