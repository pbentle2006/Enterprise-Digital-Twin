export abstract class BaseAgent<TContext = any, TResult = any> {
  abstract name: string;
  abstract describe(): string;
  abstract run(context: TContext): Promise<TResult>;
}
