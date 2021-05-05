import { Operation } from './api';
import { createTask } from './task';

export function sleep(duration: number): Operation<void> {
  return () => {
    let { task, resolve } = createTask<void>();
    let timeoutId = setTimeout(resolve, duration);
    task.consume(() => clearTimeout(timeoutId));
    return task;
  }
}
