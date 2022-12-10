/** @jsx Didact.createElement */
import Didact from ".."
// import {jest} from '@jest/globals'

describe('createElement', () => {
  test('element type', () => {
    const Div = <div>HelloWorld!</div>;
    expect(Div.type).toEqual('div');
    expect(Div.props.children[0].type).toEqual('TEXT_ELEMENT');
  })
  test('style props', () => {
    const Div = <div style={{backgroundColor: 'black'}}>HelloWorld!</div>
    expect(Div.props.style).toEqual({'backgroundColor': 'black'});
  })
})