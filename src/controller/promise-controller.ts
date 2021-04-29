import { Controller } from './controller';

export function createPromiseController<T>(promise: Promise<T>): Controller<T> {
  return function start(tree) {
    let { resolve, reject } = tree;
    promise.then(resolve, reject);
  }
}
