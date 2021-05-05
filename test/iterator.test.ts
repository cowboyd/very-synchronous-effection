import { createNumber, blowUp } from './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { createTask, run, sleep } from '../src/index';

describe('generator function', () => {
  it('can compose multiple promises via generator', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield Promise.resolve(55);
      return one + two;
    });
    await expect(task).resolves.toEqual(67);
  });

  it('can compose operations', async () => {
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield createNumber(55);
      return one + two;
    });
    await expect(task).resolves.toEqual(67);
  });

  it('rejects generator if subtask promise fails', async () => {
    let error = new Error('boom');
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield blowUp;
      return one + two;
    });
    await expect(task).rejects.toEqual(error);
  });

  it('rejects generator if generator creation fails', async () => {
    let task = run(function() {
      throw new Error('boom');
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
  });

  it('rejects generator if subtask operation fails', async () => {
    let task = run(function*() {
      let one: number = yield createNumber(12);
      let two: number = yield blowUp;
      return one + two;
    });
    await expect(task).rejects.toHaveProperty('message', 'boom');
  });

  it('can recover from errors in promise', async () => {
    let error = new Error('boom');
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number;
      try {
        yield Promise.reject(error);
        two = 9;
      } catch(e) {
        // swallow error and yield in catch block
        two = yield Promise.resolve(8);
      }
      let three: number = yield Promise.resolve(55);
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
  });

  it('can recover from errors in operation', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number;
      try {
        yield blowUp;
        two = 9;
      } catch(e) {
        // swallow error and yield in catch block
        two = yield Promise.resolve(8);
      }
      let three: number = yield Promise.resolve(55);
      return one + two + three;
    });
    await expect(task).resolves.toEqual(75);
  });

  it('can halt generator', async () => {
    let task = run(function*() {
      let one: number = yield Promise.resolve(12);
      let two: number = yield;
      return one + two;
    });

    task.halt();

    await expect(task).rejects.toMatchObject({ message: /halted/ });
  });

  it('halts task when halted generator', async () => {
    let didHalt: boolean = false;
    let task = run(function*() {
      yield function*() {
        try {
          yield;
        } finally {
          didHalt = true;
        }
      }
    });

    task.halt();

    expect(didHalt).toBe(true);

    await expect(task).rejects.toMatchObject({ message: /halted/ });
  });

  it('can suspend in finally block', async () => {
    let eventually = createTask<number>();

    let task = run(function*() {
      try {
        yield;
      } finally {
        yield sleep(10);
        eventually.resolve(123);
      }
    });

    task.halt();

    await expect(eventually.task).resolves.toEqual(123);
  });

  it('can await halt', async () => {
    let didRun = false;

    let task = run(function*() {
      try {
        yield;
      } finally {
        yield Promise.resolve(1);
        didRun = true;
      }
    });

    await task.halt();

    expect(didRun).toEqual(true);
  });

  // it.skip('can be halted while in the generator', async () => {
  //   let task = run(function*(inner) {
  //     let reject: (error: Error) => void;
  //     inner.spawn(function*() {
  //       yield sleep(2);
  //       reject && reject(new Error('boom'));
  //     });
  //     yield { perform: (_res, rej) => { reject = rej } };
  //   });

  //   await expect(task).rejects.toHaveProperty('message', 'boom');
  // });

  // it.skip('can halt itself', async () => {
  //   let task = run(function*(inner) {
  //     inner.halt();
  //   });

  //   await expect(task).rejects.toHaveProperty('message', 'halted');
  //   expect(task.state).toEqual('halted');
  // });
});
