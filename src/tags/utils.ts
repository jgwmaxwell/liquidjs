import { Engine } from "../index";
import { Tag, TagConstructor } from "../types";

export const TagFactory = (tag: TagConstructor, liquid: Engine) => (): Tag => new tag(liquid);

export const toString = (buf: Buffer) => buf.toString("utf-8");
