type Join<Strs extends readonly string[], Result extends string = ''> = Strs extends [
    infer First extends string,
    ...infer Rest extends readonly string[],
]
    ? Join<Rest, `${Result}${First}`>
    : Result;

type X = Join<['a', 'b', 'c']>; // => 'abc'
//   ^?
