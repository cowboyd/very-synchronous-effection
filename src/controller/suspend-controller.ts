import { createTask, Task } from '../task';
import { Controller } from './controller';

export function createSuspendController<T>(): Controller<T> {
  return {
    start: () => createTask<T>().task,
    stop: () => Task.resolve(),
    interrupt: () => { }
  };
}
