import { createTask } from '../task';
import { Controller } from './controller';

export function createPromiseController<T>(promise: Promise<T>): Controller<T> {
  let { task, resolve, reject } = createTask<T>();

  function start() {
    promise.then(resolve, reject);
    return task;
  }

  function stop() {
    return task.halt();
  }

  function interrupt() {}

  return { start, stop, interrupt }
}
