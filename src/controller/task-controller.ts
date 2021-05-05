import { Controller } from './controller';
import { Task } from '../task';

export function createTaskController<T>(task: Task<T>): Controller<T> {
  return {
    start: () => task,
    stop: () => Task.resolve(),
    interrupt: () => { }
  };
}
