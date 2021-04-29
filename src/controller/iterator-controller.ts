import { Controller } from './controller';
import { Operation, OperationIterator } from "../api";
import { chain, Task } from '../task';
import { createTree } from '../tree';

type Continuation<T> = () => IteratorResult<Operation<unknown>, T>;

export function createIteratorController<T>(iterator: OperationIterator<T>): Controller<T> {
  return function start(tree) {
    let { resolve, reject, children } = tree;

    function step(operation: Operation<unknown>): Task<T> {
      let child = createTree(operation, children);

      return chain(child.task, getValue => {
        return evaluate(() => iterator.next(getValue()));
      });
    }

    function evaluate(continuation: Continuation<T>): Task<T> {
      let driver = Task.resolve(continuation);

      return chain(driver, getValue => {
        let next = getValue()();
        if (next.done) {
          return Task.resolve(next.value);
        } else {
          return step(next.value)
        }
      });
    }

    evaluate(() => iterator.next()).consume(getValue => {
      try {
        resolve(getValue());
      } catch (error) {
        reject(error);
      }
    });
  }
}
