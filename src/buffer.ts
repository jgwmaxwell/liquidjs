export class WriteBuffer {
  private bufs: Buffer[];

  constructor() {
    this.bufs = [];
  }

  public write(str: string) {
    return this.bufs.push(Buffer.from(str));
  }

  public read(): string {
    return Buffer.concat(this.bufs).toString("utf-8");
  }

  public toString(): string {
    return this.read();
  }

  public close() {
    this.bufs = [];
  }
}
