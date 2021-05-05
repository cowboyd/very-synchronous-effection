import { Children } from '../tree';
import { Operation, Scope } from '../api';
import { createPromiseController } from './promise-controller';
import { createIteratorController } from './iterator-controller';
import { createTaskController } from './task-controller';
import { createFunctionController } from './function-controller';
import { createSuspendController } from './suspend-controller';
import { isPromise, isGenerator } from '../predicates';
import { isTask, Task } from '../task';

export interface Controller<T> {
  start(scope: Scope): Task<T>;
  stop(): Task<void>;
  interrupt(): void;
};

export function createController<T>(operation: Operation<T>, children: Children): Controller<T> {
  if (!operation) {
    return createSuspendController();
  } else if (isTask(operation)) {
    return createTaskController(operation);
  } else if (isPromise(operation)) {
    return createPromiseController(operation);
  } else if (isGenerator(operation)) {
    return createIteratorController(operation, children);
  } else if (typeof operation === 'function') {
    return createFunctionController(operation, children);
  } else {
    throw new Error('TODO: unknown operation '+ operation);
  }
}
