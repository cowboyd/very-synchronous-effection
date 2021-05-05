import { Operation, Scope } from './api';
import { Task, chain, createTask } from './task';
import { catchHalt } from './catch-halt';

import { createController } from './controller';
import { createCallback } from './callback';

export type Children = Set<CallFrame>;

export interface CallFrame<T = any> {
  id: number;
  task: Task<T>;
  scope: Scope;
  operation: Operation<T>;
  children: Children;
}

let ids = 1;

export function createCallFrame<T>(operation: Operation<T>, siblings: Children): CallFrame<T> {
  let children: Children = new Set();

  let { start, stop, interrupt } = createController(operation, children);

  let scope: Scope = { spawn };

  let shutdown = createCallback(() => {
    interrupt();
    return chain(haltChildren(children), assertCleanShutdown => {
      assertCleanShutdown();
      return stop();
    })
  });

  // this is the main computation sequence. The shutdown sequence is inserted in between
  // when the value is obtained from the controller, and when it is transmitted
  // to the exit point of this call frame. That way, shutdown is _guaranteed_ to have
  // completed successful before the value is ever available to the caller
  let compute = createCallback(() => chain(start(scope), getValue => chain(shutdown(), assertCleanShutdown => {
    assertCleanShutdown();
    return Task.resolve(getValue())
  })));

  let { task: returnValue, resolve, reject } = createTask<T>();

  let task = {
    ...returnValue,
    halt() {
      returnValue.halt();
      return shutdown();
    }
  }

  function spawn<R>(operation: Operation<R>): Operation<Task<R>> {
    return () => {
      let child = createCallFrame<R>(operation, children);

      return Task.resolve(child.task);
    }
  }

  let tree: CallFrame<T> = {
    id: ids++,
    operation,
    children,
    task,
    scope
  };

  siblings.add(tree);

  //this starts the actual evaluation of the operation
  compute().consume(getValue => {
    try {
      resolve(getValue());
    } catch (error) {
      reject(error);
    }
  })

  return tree;
}

function haltChildren(children: Children): Task<void> {
  return Array.from(children)
    .reverse()
    .reduce((current, child) => chain(current.consume(catchHalt), assertSuccess => {

      // There is no "value" associated with halt,
      // but if the previous halt raised a non halt related error, this will
      // propagate it
      assertSuccess();

      return child.task.halt().consume(catchHalt).consume(getValue => {
        children.delete(child);
        return getValue();
      });
    }), Task.resolve())
}
