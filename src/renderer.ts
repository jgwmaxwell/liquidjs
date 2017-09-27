import { WriteBuffer } from "./buffer";
import { evalExp } from "./syntax";
import { TagInstance } from "./tagInstance";
import { ControlTemplate, OutputTemplate, Scope, Template, Writeable } from "./types";
import {
  RenderBreakError,
  RenderError,
} from "./util/error";

const defaultString = (val: any) => val === undefined ? "" : val;

const write = (buf: Writeable) => (content: string) => {
  if (typeof content !== "string") { return buf; }
  buf.write(content);
  return buf;
};

// tslint:disable:no-this
export class Renderer {
  public renderTemplates(templates: Template[], scope: Scope, writer?: Buffer): Promise<Writeable> {
    const output = writer || new WriteBuffer();

    return Promise
      .all(templates.map(template =>
        this
          .renderTemplate(template, scope, output)
          .catch((err: Error) => {
            if (err instanceof RenderBreakError) {
              err.resolvedHTML = "FIXME";
              throw err;
            }
            throw new RenderError(err, template);
          })))
      .then(() => output);
  }

  public renderTemplate = (template: Template, scope: Scope, writer?: Writeable): Promise<Writeable> => {
    const output = writer || new WriteBuffer();
    switch (template.type) {
      case "tag":
        return this.renderTag(template, scope, output);
      case "output":
        return this.evalOutput(template, scope, output);
      case "control":
        return Promise.resolve(output);
      default:
        return Promise.resolve(template.value).then(defaultString).then(write(output));
    }
  }

  public renderTag(template: ControlTemplate | TagInstance, scope: Scope, output: Writeable): Promise<Writeable> {
    if (template.type === "control") {
      return Promise.reject(new RenderBreakError(template.name));
    }
    return template.render(scope).then(write(output));
  }

  public evalOutput(template: OutputTemplate, scope: Scope, output: Writeable): Promise<Writeable> {
    // tslint:disable-next-line:no-console
    console.log("evalOutput: ", template);
    return Promise.resolve(
      template
        .filters
        .reduce(
          (prev, filter) => filter.render(prev, scope),
          evalExp(template.initial, scope),
       )).then(write(output));
  }
}
