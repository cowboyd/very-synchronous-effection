import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, Task } from '../src/index';

describe.only('spawn', () => {
  it('can spawn a new child task', async () => {
    let root = run(function*(scope) {
      let child: Task<number> = yield scope.spawn(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);

        return one + two;
      });

      return yield child;
    });
    await expect(root).resolves.toEqual(67);
  });

  it('halts child when halted', async () => {
    let child: Task<void> | undefined;
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        yield;
      });

      yield;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty('name', 'HaltError');
  });

  it('halts child when finishing normally', async () => {
    let child: Task<void> | undefined;
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        yield;
      });

      return 1;
    });

    await expect(root).resolves.toEqual(1);
    await expect(child).rejects.toHaveProperty('name', 'HaltError');
  });

  it('halts child when errored', async () => {
    let child;
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        yield;
      });

      throw new Error('boom');
    });

    await expect(root).rejects.toHaveProperty('message', 'boom');
    await expect(child).rejects.toHaveProperty('name', 'HaltError');
  });

  it.skip('rejects parent when child errors', async () => {
    let child;
    let error = new Error("moo");
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        throw error;
      });

      yield;
    });

    await expect(root).rejects.toEqual(error);
    await expect(child).rejects.toEqual(error);
  });

  it('finishes normally when child halts', async () => {
    let child;
    let root = run(function*(context) {
      child = yield context.spawn(undefined);
      yield child.halt();

      return "foo";
    });

    await expect(root).resolves.toEqual("foo");
    await expect(child).rejects.toHaveProperty('name', 'HaltError');
  });

  it.skip('rejects when child errors during completing', async () => {
    let child;
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        try {
          yield
        } finally {
          throw new Error("moo");
        }
      });
      return "foo";
    });

    await expect(root).rejects.toHaveProperty('message', 'moo');
    await expect(child).rejects.toHaveProperty('message', 'moo');
  });

  it('rejects when child errors during halting', async () => {
    let child;
    let root = run(function*(context) {
      child = yield context.spawn(function*() {
        try {
          yield
        } finally {
          throw new Error("moo");
        }
      });
      yield;
      return "foo";
    });

    await expect(root.halt()).rejects.toHaveProperty('message', 'moo');

  });

  it('halts when child finishes during asynchronous halt', async () => {
    let didFinish = false;
    let root = run(function*(context) {
      yield context.spawn(function*() {
        yield sleep(5)
      });
      try {
        yield;
      } finally {
        yield sleep(20);
        didFinish = true;
      }
    });

    await root.halt();

    expect(didFinish).toEqual(true);
  });

  it('runs destructors in reverse order and in series', async () => {
    let result: string[] = [];
    let root = run(function*(context) {
      yield context.spawn(function*() {
        try {
          yield
        } finally {
          result.push('first start');
          yield sleep(5);
          result.push('first done');
        }
      });
      yield context.spawn(function*() {
        try {
          yield
        } finally {
          result.push('second start');
          yield sleep(10);
          result.push('second done');
        }
      });
    });

    await root;
    expect(result).toEqual(['second start', 'second done', 'first start', 'first done']);
  });
});
