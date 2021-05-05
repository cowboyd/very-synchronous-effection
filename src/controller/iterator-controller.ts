import { Controller } from './controller';
import { Operation, OperationIterator } from "../api";
import { chain, Task } from '../task';
import { createTree, Children } from '../tree';
import { catchHalt } from '../catch-halt';

type Continuation<T> = () => IteratorResult<Operation<unknown>, T>;

export function createIteratorController<T>(iterator: OperationIterator<T>, children: Children): Controller<T> {

  let interrupted = false;

  function evaluate(continuation: Continuation<T>): Task<T> {
    let current = Task.resolve(continuation);

    return chain(current, getValue => {
      let next = getValue()();
      if (next.done) {
        return Task.resolve(next.value);
      } else {
        return step(next.value)
      }
    });
  }

  function step(operation: Operation<unknown>) {
    let child = createTree(operation, children);

    return chain(child.task, getValue => {
      if (interrupted) {
        interrupted = false;
        return Task.halt<T>();
      }
      try {
        let value = getValue();
        return evaluate(() => iterator.next(value));
      } catch (error) {
        return evaluate(() => iterator.throw(error));
      }
    });
  }

  function start(): Task<T> {
    return evaluate(() => iterator.next());
  }

  function stop(): Task<void> {
    return evaluate(() => iterator.return(undefined as unknown as T))
      .consume(catchHalt);
  }

  function interrupt(): void {
    interrupted = true;
  }

  return { start, stop, interrupt };
}
