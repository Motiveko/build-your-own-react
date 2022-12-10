import { toPascal } from ".."

describe('toPascal', () => {
  test('first testt', () => {
    expect(toPascal('backgroundColor')).toEqual('background-color');
  })
})