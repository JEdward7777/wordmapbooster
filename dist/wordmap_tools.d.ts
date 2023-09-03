/// <reference types="node" />
import { Token } from "wordmap-lexer";
import WordMap from "wordmap";
import { Alignment, Suggestion, Prediction } from 'wordmap';
import { Writable } from 'stream';
import { JsonDict } from "./misc_tools";
export declare class ChapterVerse {
    chapter: number;
    verse: number;
    constructor(chapter: number, verse: number);
}
export declare function extract_alignment_frequency(map: WordMap): object;
export declare function add_book_alignment_to_wordmap(targetBook: {
    [key: number]: any;
}, loaded_alignment: {
    [key: number]: any;
}, map: WordMap, excluded_verse?: ChapterVerse | null): void;
export declare function compile_verse_text_pair(source_book: JsonDict, target_book: {
    [key: number]: any;
}, selected_verse: ChapterVerse): {
    sourceVerseText: any;
    targetVerseText: any;
};
export declare function convert_tc_to_token_dict(book_id: string, text: {
    [key: number]: any;
}, is_greek_token_format: boolean): {
    [key: string]: Token[];
};
/**
Converts the alignment data from the TranslationCore file format to the WordMap object structure.
@param book_id A string used to identify the book, for example "mat".
@param alignments The alignment data in the TranslationCore file format.
@param source_tokens The converted tokens in the source language, used to supply source Tokens.
@param target_tokens The converted tokens in the target language, used to supply target Tokens.
@returns An object containing an array of Alignment objects in the WordMap object structure.
*/
export declare function convert_alignment_to_alignment_dict(book_id: string, alignments: {
    [key: number]: any;
}, source_tokens: {
    [key: string]: Token[];
}, target_tokens: {
    [key: string]: Token[];
}): {
    [key: string]: Alignment[];
};
export declare function word_map_predict_tokens(m: WordMap, from_tokens: Token[], to_tokens: Token[], maxSuggestions?: number, minConfidence?: number): Suggestion[];
/**
 * Generates a string hash to represent a specific token so we can relate tokens with dictionaries.
 * @param t The token to generate a hash for.
 * @returns the hash of the token.
 */
export declare function token_to_hash(t: Token): string;
export declare function is_correct_prediction(suggested_mapping: Prediction, manual_mappings: Alignment[]): boolean;
export declare function is_part_of_correct_prediction(suggested_mapping: Prediction, manual_mappings: Alignment[]): boolean;
export declare function grade_mapping_method(source_sentence_tokens_dict: {
    [key: string]: Token[];
}, target_sentence_tokens_dict: {
    [key: string]: Token[];
}, manual_mappings_dict: {
    [key: string]: Alignment[];
}, output_stream: Writable, mapping_function: (from_tokens: Token[], to_tokens: Token[]) => Suggestion[]): void;
/**
 * Adds the indexing location into tokens similar to tokenizeWords in Lexer.
 * https://github.com/unfoldingWord/wordMAP-lexer/blob/develop/src/Lexer.ts#L20
 * @param {Token[]} inputTokens - an array Wordmap Token objects.
 * @param sentenceCharLength - the length of the sentence in characters
 */
export declare function updateTokenLocations(inputTokens: any, sentenceCharLength?: number): void;
