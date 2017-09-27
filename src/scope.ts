import { get, has, isNil, set } from "lodash";
import * as lexical from "./lexical";
import * as t from "./types";
import { assert } from "./util/assert";

const setPropertyByPath = (obj: Scope, path: string, val: any) => {
  const paths = (path + "").replace(/\[/g, ".").replace(/\]/g, "").split(".");
  // tslint:disable-next-line:no-let
  for (let i = 0; i < paths.length; i++) {
    const key = paths[i];
    if (i === paths.length - 1) {
      return (set(obj.vars, key, val));
    }
    if (undefined === obj.vars[key]) {
      // tslint:disable-next-line:no-expression-statement
      set(obj.vars, key, {});
    }
    // case for readonly objects
    // TODO: What does this do?
    // tslint:disable-next-line:no-expression-statement
    // obj = get(obj.vars, key, {});
  }
};

const getValueFromParent = (key: string, value: any) =>
  (key === "size" && (Array.isArray(value) || typeof value === "string"))
    ? value.length
    : get(value, key);

const getValueFromScopes = (key: string, scopes: Scope[]): any => {
  for (const scope of scopes) {
    if (has(scope.vars, key)) {
      return get(scope.vars, key);
    }
  }

  throw new TypeError("undefined variable: " + key);
};

// tslint:disable:no-let no-expression-statement
const matchRightBracket = (str: string, begin: number) => {
  let stack = 1; // count of '[' - count of ']'
  for (let i = begin; i < str.length; i++) {
    if (str[i] === "[") {
      stack++;
    }
    if (str[i] === "]") {
      stack--;
      if (stack === 0) {
        return i;
      }
    }
  }
  return -1;
};
// tslint:enable:no-let no-expression-statement

// tslint:disable:no-class no-this no-object-mutation no-expression-statement ban-types
export class Scope implements t.Scope {
  public scopes: Scope[];
  public opts: t.Options;
  public vars: t.Dict<any>;

  constructor(scopes: Scope[], opts: t.Options) {
    this.scopes = scopes;
    this.opts = opts;
  }

  public getAll() {
    return this.scopes.reduce((memo, scope) => Object.assign(memo, scope.vars), {});
  }

  public get(str: string) {
    try {
      return this.getPropertyByPath(this.scopes, str);
    } catch (e) {
      if (!/undefined variable/.test(e.message) || this.opts.strictVariables) {
        throw e;
      }
    }
  }

  public set(key: string, val: any): Scope {
    // const scope = this.findScopeFor(key); ---> TODO: This has to be wrong, you can't edit arbitrary scopes, that's stupid.
    setPropertyByPath(this, key, val);
    return this;
  }

  public push(ctx: t.Dict<any>) {
    assert(ctx, `trying to push ${ctx} into scopes`);
    return new Scope(this.scopes, this.opts);
  }

  public findScopeFor(key: string): Scope {
    // tslint:disable-next-line:no-let
    let i = this.scopes.length - 1;
    while (i >= 0 && !has(this.scopes[i], key)) {
      i--;
    }
    if (i < 0) {
      i = this.scopes.length - 1;
    }
    return this.scopes[i];
  }

  public unshift(ctx: Scope) {
    assert(ctx, `trying to push ${ctx} into scopes`);
    return this.scopes.unshift(ctx);
  }

  public shift(): Scope | undefined {
    return this.scopes.shift();
  }

  public getPropertyByPath(scopes: Scope[], path: string = "") {
    const paths = this.propertyAccessSeq(path);
    if (!paths.length) {
      assert(path, `undefined variable: ${path}`);
    }

    const key = assert(paths.shift(), "No key found");
    const value = getValueFromScopes(key, scopes);

    return paths.reduce(
      (val: any, k: string) => {
        if (isNil(value)) {
          throw new TypeError(`undefined variable: ${k}`);
        }
        return getValueFromParent(k, val);
      },
      value,
    );
  }

  /*
   * Parse property access sequence from access string
   * @example
   * accessSeq("foo.bar")            // ['foo', 'bar']
   * accessSeq("foo['bar']")      // ['foo', 'bar']
   * accessSeq("foo['b]r']")      // ['foo', 'b]r']
   * accessSeq("foo[bar.coo]")    // ['foo', 'bar'], for bar.coo == 'bar'
   */
  // tslint:disable:no-let
  public propertyAccessSeq(str: string) {
    const seq: string[] = [];
    let name = "";
    let j: number;
    let i = 0;

    const push = () => {
      if (name.length) { seq.push(name); }
      name = "";
    };

    while (i < str.length) {
      switch (str[i]) {
        case "[":
          push();

          const delimiter = str[i + 1];
          if (/['"]/.test(delimiter)) { // foo["bar"]
            j = str.indexOf(delimiter, i + 2);
            assert(j !== -1, `unbalanced ${delimiter}: ${str}`);
            name = str.slice(i + 2, j);
            push();
            i = j + 2;
          } else { // foo[bar.coo]
            j = matchRightBracket(str, i + 1);
            assert(j !== -1, `unbalanced []: ${str}`);
            name = str.slice(i + 1, j);
            if (!lexical.isInteger(name)) { // foo[bar] vs. foo[1]
              name = this.get(name);
            }
            push();
            i = j + 1;
          }
          break;
        case ".": // foo.bar, foo[0].bar
          push();
          i++;
          break;
        default: // foo.bar
          name += str[i];
          i++;
      }
    }
    push();
    return seq;
  }
}
// tslint:enable:no-class no-this no-object-mutation no-expression-statement ban-types no-let

const defaultOpts: t.Options = {
  blocks: {},
  root: [],
  strictFilters: false,
  strictVariables: false,
};

export const factory = (prev: Scope, opts: t.Options): Scope => {
  const options = Object.assign({}, defaultOpts, opts);
  const ctx = Object.assign({}, prev, { liquid: options });

  return new Scope([ctx], options);
};
