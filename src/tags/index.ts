import { Engine } from "../";

import { assign } from "./assign";
import { comment } from "./comment";
import { decrement } from "./decrement";
import { forTag } from "./for";
import { ifTag } from "./if";
import { include } from "./include";
import { increment } from "./increment";

export const registerAll = (engine: Engine) => {
  assign(engine);
  comment(engine);
  decrement(engine);
  forTag(engine);
  ifTag(engine);
  include(engine);
  increment(engine);
};
