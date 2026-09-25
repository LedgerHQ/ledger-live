import type { Function_ } from '../../utils';
import { wrapFunction } from '../../utils';
import type { AllureRuntime, HandlebarsAPI, ParameterOptions, UserParameter } from '../types';

export type FunctionalStepsModuleContext = {
  runtime: Pick<AllureRuntime, 'step' | 'parameter'>;
  handlebars: HandlebarsAPI;
};

export class StepsDecorator {
  constructor(protected readonly context: FunctionalStepsModuleContext) {}

  createStep<T, F extends Function_<T>>(
    nameFormat: string,
    function_: F,
    userParameters?: UserParameter[],
  ): F {
    const runtime = this.context.runtime;
    const formatName = this.context.handlebars.compile(nameFormat);

    function resolveParameters(arguments_: IArguments): ResolvedParameter[] {
      const parameters = userParameters ?? (Array.from(arguments_, noop) as UserParameter[]);
      return parameters.map(resolveParameter, arguments_);
    }

    function createHandlebarsContext(parameters: ResolvedParameter[]) {
      const context: Record<string | number, unknown> = {};
      for (const [name, index, value] of parameters) {
        context[name] = value;
        context[index] = value;
      }
      return context;
    }

    const handleArguments = (parameters: ResolvedParameter[]) => {
      for (const [name, , value, options, raw] of parameters) {
        if (raw != null || userParameters == null) {
          runtime.parameter(name, value, options);
        }
      }
    };

    return wrapFunction(function_, function (this: unknown): T {
      const arguments_ = arguments;
      const parameters = resolveParameters(arguments_);
      const handlebarsContext = createHandlebarsContext(parameters);

      return runtime.step(
        formatName(handlebarsContext),
        wrapFunction(
          function_,
          function step(this: unknown) {
            handleArguments(parameters);
            return Reflect.apply(function_, this, arguments_);
          }.bind(this),
        ),
      );
    } as F);
  }
}

function resolveParameter(this: unknown[], parameter: UserParameter, index: number) {
  const { name = `${index}`, ...options } =
    typeof parameter === 'string' ? { name: parameter } : (parameter ?? {});

  return [name, index, this[index], options, parameter] as ResolvedParameter;
}

type ResolvedParameter = [string, number, unknown, ParameterOptions, UserParameter];

function noop() {
  /* no-op */
}
