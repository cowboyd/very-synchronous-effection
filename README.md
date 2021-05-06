# very-synchronous-effection

We've had several versions of effection that have different modes of
evaluation. We started with a state machine, then experimented with an
asynchronous runner, and then ultimately ended up going back to a
state machine. However, there have been some difficulties that pop up
from time to time with operations behaving differently if performed in a
synchronous context vs an asynchronous context.

As a result we have to resort to strange [constructs to make code re-entrant][1]

Furthermore, we ended up finding a bug in code that also needed to be
re-entrant, but wasn't protected by the "re-entrant"
continuations. That begged the question: what if this is a core need,
and we based not just some edge cases in effection around it, but the
_entire_ evaluation process?

This is spike to do just that. It contains the smallest synchronous
primitive I could manage, the `Task`. A Task in this context is
almost exactly like a promise. In fact, if you want to consume it as a
promise, you can. But really, it is meant for consuming values and
continuing computations synchronously. To do this, you can consume it
synchronously:

```js
Task.resolve(5).consume(getValue => console.log('value = ', getValue()));
```

The above code will execute completely synchronously.

What's nice about this is that errors are neither allowed to escape
from a task, nor able to disappear without explicitly handling
them. It does this by forcing the caller to "unbox" the current value, do
something with it, and then the return is placed back into a box. That
box could contain an error.

```js
let bomb = Task.resolve(20).consume(() => { throw new Error()});

// this task holds an error that will be thrown if you try and
// access it

bomb.consume(getValue => {
  try {
    return getValue() * 2;
  } catch (error) {
    console.log('error = ', error);
    throw error;
  }
})
```

In this way, we can establish explicit, synchronous, sequences that
always maintain the value _and_ error context as they execute.

They are similar to promises, not callbacks in that a task is
only ever resolved, rejected, or halted once, and the consumers are
only executed once, synchronously. However, if a consumer of a task is
added after it has been settled, then it will be executed immediately.

It turns out that this approach simplifies things considerably,
because the sequences of how control enters, halts, and then exits a
task are explicit objects and not sequences of events, and any code
that can resolve synchronously will.


This to note:

1. Because the `Task` is now a synchronous primitive, there is no need
   for a separate `Resolution` operation. you can just use a `Task`
2. If a value is available synchronously either because it is a `Task`
   or because it is a generator that yields only synchronous
   operations, then the entire operation will be synchronous.
3. Controllers seem much simpler.


## Development

This project uses `npm`, although it might work with yarn.

``` shell
> npm install
> npm test
```

[2]: https://github.com/thefrontside/effection/blob/00562fdac1153ad7a17533eb95ab0e8081bf09fb/packages/core/src/controller/iterator-controller.ts#L33-L50
