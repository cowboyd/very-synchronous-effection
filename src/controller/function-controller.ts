import { OperationFn, Scope } from '../api';
import { Task } from '../task';
import { Children } from '../tree';
import { Controller, createController } from './controller';

export function createFunctionController<T>(fn: OperationFn<T>, children: Children): Controller<T> {
  let delegate: Controller<T>;

  function start(scope: Scope): Task<T> {
    try {
      let operation = fn(scope);
      delegate = createController(operation, children);
      return delegate.start(scope);
    } catch (error) {
      return Task.reject(error);
    }
  }

  function stop() {
    if (delegate) {
      return delegate.stop();
    } else {
      return Task.resolve();
    }
  }

  function interrupt() {
    delegate && delegate.interrupt();
  }

  return { start, stop, interrupt };
}
