import { StepDescription } from '../../types';
import { msg } from '../../utils';

export class Detox {
  static setUpCustomEspressoIdlingResources(): StepDescription {
    return msg('Set up custom Espresso idling resources');
  }

  static runDetoxTests(): StepDescription {
    return msg('Run Detox tests');
  }

  static launchMainActivity(): StepDescription {
    return msg('Launch main activity');
  }

  static startActivityFromUrl(url: string): StepDescription {
    return msg(`Start activity from URL: ${url}`);
  }

  static startActivityFromNotification(dataFilePath: string): StepDescription {
    return msg(`Start activity from notification: ${dataFilePath}`);
  }

  static getAppContext(): StepDescription {
    return msg('Get application context');
  }

  static generateViewHierarchyXml(shouldInjectTestIds: boolean): StepDescription {
    return msg(`Generate view hierarchy XML`, { inject_test_ids: shouldInjectTestIds });
  }
}
