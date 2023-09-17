import WordMap from "wordmap/dist/WordMap";
import { AbstractWordMapWrapper, JLBoostWordMap, MorphJLBoostWordMap, PlaneWordMap } from "../src/boostwordmap_tools";
import { Token } from "wordmap-lexer";
import { Alignment, Ngram, Suggestion } from "wordmap";

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

  test('Should get the same results after saving and loading', async () => {

    const tenVersesJson = require('./__fixtures__/tenVerses.json');



    const sourceText: { [key: string]: Token[] } = Object.fromEntries(
      Object.entries(tenVersesJson.source_text as { [key: string]: {[key: string]: string }[] }).map(
         ([verseKey, verseTokens]: [string, { [key: string]: string }[]]) => {
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
        }
      )
    );
    const targetText: { [key: string]: Token[] } = Object.fromEntries(
      Object.entries(tenVersesJson.target_text as { [key: string]: {[key: string]: string }[] }).map(
         ([verseKey, verseTokens]: [string, { [key: string]: string }[]]) => {
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
         }
      )
    )

    const alignments: { [key: string]: Alignment[] } = Object.fromEntries(
      Object.entries(tenVersesJson.alignments as { [key: string]: { sourceNgram: { [key: string]: string }[]; targetNgram: { [key: string]: string }[] }[] }).map(
         ([verseKey, verseAlignments]: [string, { sourceNgram: { [key: string]: string }[]; targetNgram: { [key: string]: string }[] }[]]) => {
          const result: [string, Alignment[]] = [
            verseKey,
            verseAlignments.map(verseAlignment => new Alignment(
              new Ngram(verseAlignment.sourceNgram.map(token => new Token(token))),
              new Ngram(verseAlignment.targetNgram.map(token => new Token(token)))
            ))
           ];
          return result;
        }
      )
    )

    const classesToTest = [
      PlaneWordMap,
      JLBoostWordMap,
      MorphJLBoostWordMap,
    ]

    for (const classToTest of classesToTest) {
      const jlBoostWordMap = new classToTest({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false, train_steps:100 });
      await jlBoostWordMap.add_alignments_2( sourceText, targetText, alignments);

      const savedToJson = JSON.stringify(jlBoostWordMap.save());
      const loadedFromJson = AbstractWordMapWrapper.load(JSON.parse(savedToJson));

      const firstVerseKey = Object.keys( sourceText )[0]
      const firstSourceVerse = sourceText[firstVerseKey];
      const firstTargetVerse = targetText[firstVerseKey];

      //now make sure that the before and after produce the same predictions.
      const predictionsBefore: Suggestion[] = jlBoostWordMap.predict( firstSourceVerse, firstTargetVerse );
      const predictionsAfter:  Suggestion[] = loadedFromJson.predict( firstSourceVerse, firstTargetVerse );

      expect( predictionsBefore ).toStrictEqual( predictionsAfter );
    }

  })


  test('Same results after saving and loading, including corpus', async () => {

    const loadedVerses = require('./__fixtures__/tenVerses.json');

    const splitPoint = Math.round(.7*Object.keys(loadedVerses.source_text).length);

    const alignmentReferences = Object.keys(loadedVerses.source_text).slice(0,splitPoint);
    const corpusReferences = Object.keys(loadedVerses.source_text).slice(splitPoint);

    const sourceText: { [key: string]: Token[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseTokens = loadedVerses.source_text[verseKey];
          const result: [string, Token[]] = [
            verseKey,
            verseTokens.map(verseToken => new Token(verseToken))
          ];
          return result;
        }
      )
    );
    const targetText: { [key: string]: Token[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseTokens = loadedVerses.target_text[verseKey];
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
         }
      )
    )

    const alignments: { [key: string]: Alignment[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseAlignments = loadedVerses.alignments[verseKey];
          const result: [string, Alignment[]] = [
            verseKey,
            verseAlignments.map(verseAlignment => new Alignment(
              new Ngram(verseAlignment.sourceNgram.map(token => new Token(token))),
              new Ngram(verseAlignment.targetNgram.map(token => new Token(token)))
            ))
           ];
          return result;
        }
      )
    )

    const corpusSourceText: { [key: string]: Token[] } = Object.fromEntries(
      corpusReferences.map((verseKey) => {
          const verseTokens = loadedVerses.source_text[verseKey];
          const result: [string, Token[]] = [
            verseKey,
            verseTokens.map(verseToken => new Token(verseToken))
          ];
          return result;
        }
      )
    );
    const corpusTargetText: { [key: string]: Token[] } = Object.fromEntries(
      corpusReferences.map((verseKey) => {
          const verseTokens = loadedVerses.target_text[verseKey];
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
         }
      )
    ) 

    const classesToTest = [
      PlaneWordMap,
      JLBoostWordMap,
      MorphJLBoostWordMap,
    ]

    for (const classToTest of classesToTest) {
      const jlBoostWordMap = new classToTest({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false, train_steps:100 });
      jlBoostWordMap.appendKeyedCorpusTokens( corpusSourceText, corpusTargetText );
      await jlBoostWordMap.add_alignments_2( sourceText, targetText, alignments);

      const savedToJson = JSON.stringify(jlBoostWordMap.save());
      const loadedFromJson = AbstractWordMapWrapper.load(JSON.parse(savedToJson));

      const firstVerseKey = Object.keys( sourceText )[0]
      const firstSourceVerse = sourceText[firstVerseKey];
      const firstTargetVerse = targetText[firstVerseKey];

      //now make sure that the before and after produce the same predictions.
      const predictionsBefore: Suggestion[] = jlBoostWordMap.predict( firstSourceVerse, firstTargetVerse );
      const predictionsAfter:  Suggestion[] = loadedFromJson.predict( firstSourceVerse, firstTargetVerse );

      expect( predictionsBefore ).toStrictEqual( predictionsAfter );
    }

  })

  test('Same results after saving and loading, including corpus with adding method 4', async () => {

    const loadedVerses = require('./__fixtures__/tenVerses.json');

    const splitPoint = Math.round(.7*Object.keys(loadedVerses.source_text).length);

    const alignmentReferences = Object.keys(loadedVerses.source_text).slice(0,splitPoint);
    const corpusReferences = Object.keys(loadedVerses.source_text).slice(splitPoint);

    const sourceText: { [key: string]: Token[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseTokens = loadedVerses.source_text[verseKey];
          const result: [string, Token[]] = [
            verseKey,
            verseTokens.map(verseToken => new Token(verseToken))
          ];
          return result;
        }
      )
    );
    const targetText: { [key: string]: Token[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseTokens = loadedVerses.target_text[verseKey];
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
         }
      )
    )

    const alignments: { [key: string]: Alignment[] } = Object.fromEntries(
      alignmentReferences.map((verseKey) => {
          const verseAlignments = loadedVerses.alignments[verseKey];
          const result: [string, Alignment[]] = [
            verseKey,
            verseAlignments.map(verseAlignment => new Alignment(
              new Ngram(verseAlignment.sourceNgram.map(token => new Token(token))),
              new Ngram(verseAlignment.targetNgram.map(token => new Token(token)))
            ))
           ];
          return result;
        }
      )
    )

    const corpusSourceText: { [key: string]: Token[] } = Object.fromEntries(
      corpusReferences.map((verseKey) => {
          const verseTokens = loadedVerses.source_text[verseKey];
          const result: [string, Token[]] = [
            verseKey,
            verseTokens.map(verseToken => new Token(verseToken))
          ];
          return result;
        }
      )
    );
    const corpusTargetText: { [key: string]: Token[] } = Object.fromEntries(
      corpusReferences.map((verseKey) => {
          const verseTokens = loadedVerses.target_text[verseKey];
           const result: [string, Token[]] = [
             verseKey,
             verseTokens.map(verseToken => new Token(verseToken))
           ];
           return result;
         }
      )
    ) 

    const classesToTest = [
      PlaneWordMap,
      JLBoostWordMap,
      MorphJLBoostWordMap,
    ]

    for (const classToTest of classesToTest) {
      const jlBoostWordMap = new classToTest({ targetNgramLength: 5, warnings: false, forceOccurrenceOrder:false, train_steps:100 });
      jlBoostWordMap.appendKeyedCorpusTokens( corpusSourceText, corpusTargetText );
      await jlBoostWordMap.add_alignments_4( sourceText, targetText, alignments);

      const savedToJson = JSON.stringify(jlBoostWordMap.save());
      const loadedFromJson = AbstractWordMapWrapper.load(JSON.parse(savedToJson));

      const firstVerseKey = Object.keys( sourceText )[0]
      const firstSourceVerse = sourceText[firstVerseKey];
      const firstTargetVerse = targetText[firstVerseKey];

      //now make sure that the before and after produce the same predictions.
      const predictionsBefore: Suggestion[] = jlBoostWordMap.predict( firstSourceVerse, firstTargetVerse );
      const predictionsAfter:  Suggestion[] = loadedFromJson.predict( firstSourceVerse, firstTargetVerse );

      expect( predictionsBefore ).toStrictEqual( predictionsAfter );
    }

  })
});
