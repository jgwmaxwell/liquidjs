import { Engine } from "../";
import { Tag, TagToken, Token } from "../types";
import { TagFactory } from "./utils";

export class Comment implements Tag {
  private liquid: Engine;

  constructor(liquid: Engine) {
    this.liquid = liquid;
  }

  public parse(tagToken: TagToken, tokens: Token[]) {
    const stream = this.liquid.parser.parseStream(tokens)
      .on("token", (token: TagToken) => {
        if (token.name === "endcomment") {
          stream.stop();
        }
      })
      .on("end", () => {
        throw new Error(`tag ${tagToken.raw} not closed`);
      });

    stream.start();
  }

  public render() {
    return Promise.resolve("");
  }
}

export const comment = (liquid: Engine) => liquid.registerTag("comment", TagFactory(Comment, liquid));
