import WordMap from "wordmap/dist/WordMap";
import { JLBoostWordMap } from "../src/boostwordmap_tools";

describe('JLBoostWordMap', () => {
  test('Should be able to create new WordMap without throwing any exceptions', () => {
    expect(() => {
      new WordMap({});
    }).not.toThrow();
  });

  test('should create an instance without throwing any exceptions', () => {
    expect(() => {
      new JLBoostWordMap({});
    }).not.toThrow();
  });
});
