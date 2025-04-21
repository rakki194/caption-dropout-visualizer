declare module 'd3-cloud' {
  interface Word {
    text?: string;
    font?: string;
    style?: string;
    weight?: string | number;
    rotate?: number;
    size?: number;
    padding?: number;
    x?: number;
    y?: number;
    // Additional properties for our app
    value?: number;
    isOriginal?: boolean;
  }

  interface Cloud<T> {
    start(): Cloud<T>;
    stop(): Cloud<T>;
    timeInterval(): number;
    timeInterval(interval: number): Cloud<T>;
    words(): T[];
    words(words: T[]): Cloud<T>;
    size(): [number, number];
    size(size: [number, number]): Cloud<T>;
    font(): (datum: T, index: number) => string;
    font(font: string | ((datum: T, index: number) => string)): Cloud<T>;
    fontStyle(): (datum: T, index: number) => string;
    fontStyle(style: string | ((datum: T, index: number) => string)): Cloud<T>;
    fontWeight(): (datum: T, index: number) => string | number;
    fontWeight(weight: string | number | ((datum: T, index: number) => string | number)): Cloud<T>;
    rotate(): (datum: T, index: number) => number;
    rotate(rotate: number | ((datum: T, index: number) => number)): Cloud<T>;
    text(): (datum: T, index: number) => string;
    text(text: string | ((datum: T, index: number) => string)): Cloud<T>;
    spiral(): (size: [number, number]) => (t: number) => [number, number];
    spiral(name: string | ((size: [number, number]) => (t: number) => [number, number])): Cloud<T>;
    fontSize(): (datum: T, index: number) => number;
    fontSize(size: number | ((datum: T, index: number) => number)): Cloud<T>;
    padding(): (datum: T, index: number) => number;
    padding(padding: number | ((datum: T, index: number) => number)): Cloud<T>;
    random(): Cloud<T>;
    random(randomFunction: () => number): Cloud<T>;
    canvas(): Cloud<T>;
    canvas(canvasGenerator: () => HTMLCanvasElement): Cloud<T>;
    on(type: string, listener: (...args: any[]) => void): Cloud<T>;
    on(type: string): (...args: any[]) => void;
  }

  function cloud<T extends Word>(): Cloud<T>;
  function cloud(): Cloud<Word>;

  export = cloud;
} 