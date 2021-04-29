import { Operation } from './api';
import { Controller } from './controller/controller';
import { createPromiseController } from './controller/promise-controller';
import { createIteratorController } from './controller/iterator-controller';
import { createTaskController } from './controller/task-controller';
import { isPromise, isGenerator } from './predicates';
import { isTask } from './task';


export function createController<T>(operation: Operation<T>): Controller<T> {
  if (isTask(operation)) {
    return createTaskController(operation);
  } else if (isPromise(operation)) {
    return createPromiseController(operation);
  } else if (isGenerator(operation)) {
    return createIteratorController(operation);
  } else {
    throw new Error('TODO: unknown operation Type')
  }
}
