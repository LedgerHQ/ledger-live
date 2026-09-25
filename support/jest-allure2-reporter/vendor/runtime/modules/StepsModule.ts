import { isPromiseLike, isJestAssertionError, getStatusDetails } from '../../utils';
import type { AllureTestItemMetadataProxy } from '../../metadata';
import type { AllureRuntimeContext } from '../AllureRuntimeContext';

export type BasicStepsModuleContext = {
  readonly metadata: AllureTestItemMetadataProxy;
  readonly now: number;
};

export class StepsModule {
  constructor(protected readonly context: BasicStepsModuleContext) {}

  static create(context: AllureRuntimeContext): StepsModule {
    return new StepsModule({
      get metadata() {
        return context.getCurrentMetadata();
      },
      get now() {
        return context.getNow();
      },
    });
  }

  step<T = unknown>(name: string, function_: () => T): T {
    this.#startStep(name);
    const end = this.#stopStep;

    let result: T;
    try {
      result = function_();

      if (isPromiseLike(result)) {
        this.context.metadata.set('stage', 'running');

        result.then(
          () => end(),
          (error: unknown) => end(error),
        );
      } else {
        end();
      }

      return result;
    } catch (error: unknown) {
      end(error);
      throw error;
    }
  }

  #startStep = (displayName: string) => {
    this.context.metadata.$startStep().assign({
      stage: 'scheduled',
      start: this.context.now,
      displayName,
    });
  };

  #stopStep = (error?: unknown) => {
    if (error === undefined) {
      this.context.metadata
        .defaults({ status: 'passed' })
        .assign({ stage: 'finished', stop: this.context.now });
    } else {
      this.context.metadata.assign({
        stage: 'interrupted',
        status: isJestAssertionError(error) ? 'failed' : 'broken',
        statusDetails: getStatusDetails(error),
        stop: this.context.now,
      });
    }
    this.context.metadata.$stopStep();
  };
}
