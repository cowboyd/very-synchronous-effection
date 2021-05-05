import { createTask } from '../task';
import { Controller } from './controller';

export function createPromiseController<T>(promise: Promise<T>): Controller<T> {
  let result = createTask<T>();

  function start() {
    promise.then(result.resolve, result.reject);
    return result.task;
  }

  function stop() {
    return result.task.halt();
  }

  function interrupt() {}

  return { start, stop, interrupt }
}
