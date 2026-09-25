import { StepDescription } from '../../types';
export declare class Detox {
    static setUpCustomEspressoIdlingResources(): StepDescription;
    static runDetoxTests(): StepDescription;
    static launchMainActivity(): StepDescription;
    static startActivityFromUrl(url: string): StepDescription;
    static startActivityFromNotification(dataFilePath: string): StepDescription;
    static getAppContext(): StepDescription;
    static generateViewHierarchyXml(shouldInjectTestIds: boolean): StepDescription;
}
