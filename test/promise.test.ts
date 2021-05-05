import { describe, it  } from 'mocha';
import expect from 'expect';

import { run } from '../src/index';

describe('promise operations', () => {
  it('runs a promise to completion', async () => {
    let task = run(Promise.resolve(123));
    await expect(task).resolves.toEqual(123);
  });

  it('rejects a failed  promise', async () => {
    let error = new Error('boom');
    let task = run(Promise.reject(error))
    await expect(task).rejects.toEqual(error);
  });

  it('can halt a promise', async () => {
    let promise = new Promise<void>(() => { /* never resolves */ });
    let task = run(promise);

    task.halt();

    await expect(task).rejects.toMatchObject({ message: /halted/ })
  });

  describe('function', () => {
    it('runs a promise to completion', async () => {
      let task = run(() => Promise.resolve(123))
      await expect(task).resolves.toEqual(123);
    });

    it('rejects a failed promise', async () => {
      let error = new Error('boom');
      let task = run(() => Promise.reject(error))
      await expect(task).rejects.toEqual(error);
    });

    it('can halt a promise', async () => {
      let promise = new Promise(() => { /* never resolves */ });
      let task = run(() => promise);

      task.halt();

      await expect(task).rejects.toMatchObject({ message: /halted/ })
    });
  });
});
