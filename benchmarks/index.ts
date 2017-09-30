import { Suite } from "benchmark";
import { times } from "lodash";

const suite = new Suite();

suite
  .add("array-as-stack", () => {
    const a: number[] = [];
    times(10000, () => {
      a.push(1);
    });
    times(10000, () => {
      a.pop();
    });
  })
  .add("stack-as-stack", () => {
    const a: Stack<number> = Stack();
    times(10000, () => {
      a.push(1);
    });
    times(10000, () => {
      a.pop();
    });
  })
  .on("cycle", (event: any) => {
    // tslint:disable-next-line:no-console
    console.log(String(event.target));
  })
  .on("complete", () => {
    // tslint:disable-next-line:no-this no-console
    // console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  // run async
  .run({ async: false });
