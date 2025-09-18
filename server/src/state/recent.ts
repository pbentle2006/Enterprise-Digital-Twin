export type RecentSample<T> = T;

export class RecentStore<T> {
  private max: number;
  private data = new Map<string, RecentSample<T>[]>();

  constructor(max: number = 300) {
    this.max = max;
  }

  add(key: string, sample: RecentSample<T>) {
    const arr = this.data.get(key) ?? [];
    arr.push(sample);
    if (arr.length > this.max) arr.splice(0, arr.length - this.max);
    this.data.set(key, arr);
  }

  get(key: string): RecentSample<T>[] {
    return this.data.get(key) ?? [];
  }

  keys(): string[] { return Array.from(this.data.keys()); }
}
