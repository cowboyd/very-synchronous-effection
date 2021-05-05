import { Consumer, Task, createTask, chain } from './task';

interface Callback<T, Arg> {
  (value: Arg): Task<T>;
}

export function createCallback<T, Arg = void>(create: Consumer<Arg, Task<T>>): Callback<T, Arg> {
  let invoke = createTask<Arg>();
  let task = chain(invoke.task, create);

  return (arg) => {
    invoke.resolve(arg);
    return task;
  }
}
