import { Controller } from './controller';
import { Task } from '../task';

export function createTaskController<T>(operationTask: Task<T>): Controller<T> {
  return function start(tree) {
    let { resolve, reject } = tree;

    operationTask.consume(getValue =>  {
      try {
        resolve(getValue());
      } catch (error) {
        reject(error);
      }
    })
  }
}
