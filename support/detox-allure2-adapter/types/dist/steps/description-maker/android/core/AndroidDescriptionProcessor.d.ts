import { StepDescription } from '../../types';
export declare class AndroidDescriptionProcessor {
    process(payload: unknown): StepDescription | null;
    private processInvocation;
    private processArguments;
    private processNode;
    private processClassNode;
}
