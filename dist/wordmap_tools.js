"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grade_mapping_method = exports.is_part_of_correct_prediction = exports.is_correct_prediction = exports.token_to_hash = exports.word_map_predict_tokens = exports.convert_alignment_to_alignment_dict = exports.convert_tc_to_token_dict = exports.compile_verse_text_pair = exports.add_book_alignment_to_wordmap = exports.extract_alignment_frequency = exports.ChapterVerse = void 0;
var wordmap_lexer_1 = require("wordmap-lexer");
var wordmap_1 = require("wordmap");
//import usfmjs from 'usfm-js';
var usfmjs = require('usfm-js');
var ChapterVerse = /** @class */ (function () {
    function ChapterVerse(chapter, verse) {
        this.chapter = chapter;
        this.verse = verse;
    }
    return ChapterVerse;
}());
exports.ChapterVerse = ChapterVerse;
function extract_alignment_frequency(map) {
    return {
        'alignPermFreqIndex': Array.from(map.engine.alignmentMemoryIndex.permutationIndex.alignPermFreqIndex.index),
        'srcNgramPermFreqIndex': Array.from(map.engine.alignmentMemoryIndex.permutationIndex.srcNgramPermFreqIndex.index),
        'tgtNgramPermFreqIndex': Array.from(map.engine.alignmentMemoryIndex.permutationIndex.tgtNgramPermFreqIndex.index)
    };
}
exports.extract_alignment_frequency = extract_alignment_frequency;
/**
 * Converts verse objects (as in from the source language verse) into {@link Token}s.
 * @param verseObjects An array of VerseObject.
 * @returns An array of Token.
 */
function tokenizeVerseObjects(words) {
    var tokens = [];
    var completeTokens = []; // includes occurrences
    var occurrences = {};
    var position = 0;
    var sentenceCharLength = 0;
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        if (typeof occurrences[word.text] === 'undefined') {
            occurrences[word.text] = 0;
        }
        sentenceCharLength += word.text.length;
        occurrences[word.text]++;
        tokens.push(new wordmap_lexer_1.Token({
            text: word.text,
            strong: (word.strong || word.strongs),
            morph: word.morph,
            lemma: word.lemma,
            position: position,
            occurrence: occurrences[word.text]
        }));
        position++;
    }
    // inject occurrences
    for (var _a = 0, tokens_1 = tokens; _a < tokens_1.length; _a++) {
        var token = tokens_1[_a];
        completeTokens.push(new wordmap_lexer_1.Token({
            text: token.text,
            strong: token.strong,
            morph: token.morph,
            lemma: token.lemma,
            position: token.position,
            occurrence: token.occurrence,
            occurrences: occurrences[token.text],
            sentenceTokenLen: tokens.length,
            sentenceCharLen: sentenceCharLength
        }));
    }
    return completeTokens;
}
;
function add_book_alignment_to_wordmap(targetBook, loaded_alignment, map, excluded_verse) {
    if (excluded_verse === void 0) { excluded_verse = null; }
    Object.entries(targetBook).forEach(function (_a) {
        var chapter = _a[0], bookJson = _a[1];
        if (!["headers", "manifest"].includes(chapter)) {
            var chapter_alignments = loaded_alignment[chapter];
            for (var _i = 0, _b = Object.keys(bookJson); _i < _b.length; _i++) {
                var verse = _b[_i];
                //skip the excluded_verse.
                if (excluded_verse !== null && parseInt(verse) === excluded_verse.verse && parseInt(chapter) === excluded_verse.chapter) {
                    continue;
                }
                for (var _c = 0, _d = chapter_alignments[verse].alignments; _c < _d.length; _c++) {
                    var a = _d[_c];
                    var topTokensNoOccurrences = a.topWords.map(function (word) {
                        var word_copy = Object.assign({}, word);
                        delete word_copy.word;
                        word_copy.text = word.word;
                        return new wordmap_lexer_1.Token(word_copy);
                    });
                    var bottomTokensNoOccurrences = a.bottomWords.map(function (word) {
                        var word_copy = Object.assign({}, word);
                        delete word_copy.word;
                        word_copy.text = word.word;
                        return new wordmap_lexer_1.Token(word_copy);
                    });
                    var topTokens = tokenizeVerseObjects(topTokensNoOccurrences);
                    var bottomTokens = tokenizeVerseObjects(bottomTokensNoOccurrences);
                    var topNgram = new wordmap_1.Ngram(topTokens);
                    var bottomNgram = new wordmap_1.Ngram(bottomTokens);
                    var new_alignment = new wordmap_1.Alignment(topNgram, bottomNgram);
                    if (topNgram.tokenLength && bottomNgram.tokenLength) {
                        map.appendAlignmentMemory(new_alignment);
                    }
                }
            }
        }
    });
}
exports.add_book_alignment_to_wordmap = add_book_alignment_to_wordmap;
function normalizeVerseText(verse_text_in) {
    var cleaned = usfmjs.removeMarker(verse_text_in);
    var targetTokens = wordmap_lexer_1.default.tokenize(cleaned);
    var normalizedTargetVerseText = targetTokens.map(function (t) { return t.toString(); }).join(' ');
    return normalizedTargetVerseText;
}
function compile_verse_text_pair(source_book, target_book, selected_verse) {
    var _a;
    var sourceVerseObjects = source_book[selected_verse.chapter][selected_verse.verse].verseObjects.filter(function (verseObj) { return verseObj.type === "word"; });
    var sourceVerseTextWithLocation = tokenizeVerseObjects(sourceVerseObjects);
    var targetVerseText = (_a = target_book[selected_verse.chapter]) === null || _a === void 0 ? void 0 : _a[selected_verse.verse];
    var normalizedTargetVerseText = normalizeVerseText(targetVerseText);
    return { sourceVerseText: sourceVerseTextWithLocation, targetVerseText: normalizedTargetVerseText };
}
exports.compile_verse_text_pair = compile_verse_text_pair;
function convert_tc_to_token_dict(book_id, text, is_greek_token_format) {
    var result = {};
    Object.entries(text).forEach(function (_a) {
        var chapter_num = _a[0], chapter_content = _a[1];
        Object.entries(chapter_content).forEach(function (_a) {
            var verse_num = _a[0], verse_content = _a[1];
            var verse_key = "".concat(book_id, "_").concat(chapter_num, ":").concat(verse_num);
            var tokens = null;
            if (is_greek_token_format) {
                var sourceVerseObjects = verse_content.verseObjects.filter(function (verseObj) { return verseObj.type === "word"; });
                tokens = tokenizeVerseObjects(sourceVerseObjects);
            }
            else {
                var cleaned = usfmjs.removeMarker(verse_content);
                tokens = wordmap_lexer_1.default.tokenize(cleaned);
            }
            if (tokens.length > 0)
                result[verse_key] = tokens;
        });
    });
    return result;
}
exports.convert_tc_to_token_dict = convert_tc_to_token_dict;
/**
Converts the alignment data from the TranslationCore file format to the WordMap object structure.
@param book_id A string used to identify the book, for example "mat".
@param alignments The alignment data in the TranslationCore file format.
@param source_tokens The converted tokens in the source language, used to supply source Tokens.
@param target_tokens The converted tokens in the target language, used to supply target Tokens.
@returns An object containing an array of Alignment objects in the WordMap object structure.
*/
function convert_alignment_to_alignment_dict(book_id, alignments, source_tokens, target_tokens) {
    var result = {};
    Object.entries(alignments).forEach(function (_a) {
        var chapter_num = _a[0], chapter_content = _a[1];
        Object.entries(chapter_content).forEach(function (_a) {
            var verse_num = _a[0], verse_content = _a[1];
            var verse_key = "".concat(book_id, "_").concat(chapter_num, ":").concat(verse_num);
            if (verse_key in source_tokens && verse_key in target_tokens) {
                var source_verse_tokens_1 = source_tokens[verse_key];
                var target_verse_tokens_1 = target_tokens[verse_key];
                var found_alignments_1 = [];
                Object.entries(verse_content.alignments).forEach(function (_a) {
                    var alignment_num = _a[0], alignment_content = _a[1];
                    var found_top_words = [];
                    Object.entries(alignment_content.topWords).forEach(function (_a) {
                        var _word_num = _a[0], word_content = _a[1];
                        //try and find this word in the source_verse_tokens.
                        source_verse_tokens_1.forEach(function (token) {
                            //if( token.text != )
                            if (token.toString() !== word_content.word)
                                return;
                            if (token.occurrences !== word_content.occurrences)
                                return;
                            if (token.occurrence !== word_content.occurrence)
                                return;
                            found_top_words.push(token);
                        });
                    });
                    var found_bottom_words = [];
                    Object.entries(alignment_content.bottomWords).forEach(function (_a) {
                        var word_num = _a[0], word_content = _a[1];
                        //try and find this word in the target_verse_tokens.
                        target_verse_tokens_1.forEach(function (token) {
                            //if( token.text != )
                            if (token.toString() !== word_content.word)
                                return;
                            if (token.occurrences !== word_content.occurrences)
                                return;
                            if (token.occurrence !== word_content.occurrence)
                                return;
                            found_bottom_words.push(token);
                        });
                    });
                    found_alignments_1.push(new wordmap_1.Alignment(new wordmap_1.Ngram(found_top_words), new wordmap_1.Ngram(found_bottom_words)));
                });
                result[verse_key] = found_alignments_1;
            }
        });
    });
    return result;
}
exports.convert_alignment_to_alignment_dict = convert_alignment_to_alignment_dict;
function word_map_predict_tokens(m, from_tokens, to_tokens, maxSuggestions, minConfidence) {
    if (maxSuggestions === void 0) { maxSuggestions = 1; }
    if (minConfidence === void 0) { minConfidence = 0.1; }
    var engine_run = m.engine.run(from_tokens, to_tokens);
    var predictions = m.engine.score(engine_run);
    //Rolled back to wordmap version 0.6.0 from 0.8.2 and lost the last two arguments.
    var suggestions = wordmap_1.Engine.suggest(predictions, maxSuggestions /*, (m as any).forceOccurrenceOrder, minConfidence */);
    return suggestions;
}
exports.word_map_predict_tokens = word_map_predict_tokens;
/**
 * Generates a string hash to represent a specific token so we can relate tokens with dictionaries.
 * @param t The token to generate a hash for.
 * @returns the hash of the token.
 */
function token_to_hash(t) {
    return "".concat(t.toString(), ":").concat(t.occurrence, ":").concat(t.occurrences);
}
exports.token_to_hash = token_to_hash;
function is_correct_prediction(suggested_mapping, manual_mappings) {
    mappingLoop: for (var manual_mapping_i = 0; manual_mapping_i < manual_mappings.length; ++manual_mapping_i) {
        var manual_mapping = manual_mappings[manual_mapping_i];
        // const manual_mapping_source = manual_mapping.sourceNgram.getTokens();
        // const suggested_mapping_source = suggested_mapping.source.getTokens();
        // const manual_mapping_target = manual_mapping.targetNgram.getTokens();
        // const suggested_mapping_target = suggested_mapping.target.getTokens();
        var manual_mapping_source = manual_mapping.sourceNgram.getTokens().slice().sort();
        var suggested_mapping_source = suggested_mapping.source.getTokens().slice().sort();
        var manual_mapping_target = manual_mapping.targetNgram.getTokens().slice().sort();
        var suggested_mapping_target = suggested_mapping.target.getTokens().slice().sort();
        //see if the ngram on the suggestion are the same length
        if (manual_mapping_source.length != suggested_mapping_source.length)
            continue mappingLoop;
        if (manual_mapping_target.length != suggested_mapping_target.length)
            continue mappingLoop;
        //now check the source ngram is the same.
        for (var source_ngram_i = 0; source_ngram_i < manual_mapping_source.length; ++source_ngram_i) {
            var manual_word = manual_mapping_source[source_ngram_i];
            var suggested_word = suggested_mapping_source[source_ngram_i];
            if (manual_word.toString() != suggested_word.toString())
                continue mappingLoop;
            if (manual_word.occurrence != suggested_word.occurrence)
                continue mappingLoop;
            if (manual_word.occurrences != suggested_word.occurrences)
                continue mappingLoop;
        }
        //and the target ngram.
        for (var target_ngram_i = 0; target_ngram_i < manual_mapping_target.length; ++target_ngram_i) {
            var manual_word = manual_mapping_target[target_ngram_i];
            var suggested_word = suggested_mapping_target[target_ngram_i];
            if (manual_word.toString() != suggested_word.toString())
                continue mappingLoop;
            if (manual_word.occurrence != suggested_word.occurrence)
                continue mappingLoop;
            if (manual_word.occurrences != suggested_word.occurrences)
                continue mappingLoop;
        }
        //We found this mapping so no need to keep looking for it.
        return true;
    }
    return false;
}
exports.is_correct_prediction = is_correct_prediction;
function is_part_of_correct_prediction(suggested_mapping, manual_mappings) {
    //This assumes that the predictions passed in do not have ngrams greater then one.
    mappingLoop: for (var manual_mapping_i = 0; manual_mapping_i < manual_mappings.length; ++manual_mapping_i) {
        var manual_mapping = manual_mappings[manual_mapping_i];
        var manual_mapping_source = manual_mapping.sourceNgram.getTokens();
        var suggested_mapping_source = suggested_mapping.source.getTokens();
        var manual_mapping_target = manual_mapping.targetNgram.getTokens();
        var suggested_mapping_target = suggested_mapping.target.getTokens();
        //now check the source ngram is a subset of the prediction
        //every suggested source word has to be in the manual source for us to have found it.
        for (var suggested_source_ngram_i = 0; suggested_source_ngram_i < suggested_mapping_source.length; ++suggested_source_ngram_i) {
            var suggested_source_word = suggested_mapping_source[suggested_source_ngram_i];
            var found_source = false;
            for (var source_ngram_i = 0; source_ngram_i < manual_mapping_source.length && !found_source; ++source_ngram_i) {
                var manual_word = manual_mapping_source[source_ngram_i];
                if (manual_word.toString() == suggested_source_word.toString() &&
                    manual_word.occurrence == suggested_source_word.occurrence &&
                    manual_word.occurrences == suggested_source_word.occurrences) {
                    found_source = true;
                }
            }
            if (!found_source)
                continue mappingLoop;
        }
        //and the target ngram.
        for (var suggested_target_ngram_i = 0; suggested_target_ngram_i < suggested_mapping_target.length; ++suggested_target_ngram_i) {
            var suggested_target_word = suggested_mapping_target[suggested_target_ngram_i];
            var found_target = false;
            for (var target_ngram_i = 0; target_ngram_i < manual_mapping_target.length && !found_target; ++target_ngram_i) {
                var manual_word = manual_mapping_target[target_ngram_i];
                if (manual_word.toString() == suggested_target_word.toString() &&
                    manual_word.occurrence == suggested_target_word.occurrence &&
                    manual_word.occurrences == suggested_target_word.occurrences) {
                    found_target = true;
                }
            }
            if (!found_target)
                continue mappingLoop;
        }
        //We found this mapping so no need to keep looking for it.
        return true;
    }
    return false;
}
exports.is_part_of_correct_prediction = is_part_of_correct_prediction;
function grade_mapping_method(source_sentence_tokens_dict, target_sentence_tokens_dict, manual_mappings_dict, output_stream, mapping_function) {
    output_stream.write("verse id,num_manual_mappings,num_suggested_mappings,num_correct_mappings,ratio_correct\n");
    var ratio_correct_sum = 0;
    Object.entries(target_sentence_tokens_dict).forEach(function (_a) {
        var sentence_key = _a[0], target_sentence_tokens = _a[1];
        if (sentence_key in source_sentence_tokens_dict) {
            var source_sentence_tokens = source_sentence_tokens_dict[sentence_key];
            var suggestions = mapping_function(source_sentence_tokens, target_sentence_tokens);
            var manual_mappings = manual_mappings_dict[sentence_key];
            var firstPredictions = suggestions[0].getPredictions();
            var num_correct_mappings = 0;
            for (var suggested_mapping_i = 0; suggested_mapping_i < firstPredictions.length; ++suggested_mapping_i) {
                if (is_correct_prediction(firstPredictions[suggested_mapping_i], manual_mappings)) {
                    num_correct_mappings++;
                }
            }
            var ratio_correct = num_correct_mappings / manual_mappings.length;
            ratio_correct_sum += ratio_correct;
            output_stream.write("".concat(sentence_key, ",").concat(manual_mappings.length, ",").concat(firstPredictions.length, ",").concat(num_correct_mappings, ",").concat(ratio_correct, "\n"));
            if (global.gc) {
                global.gc();
            }
        }
    });
    var average_ratio_correct = ratio_correct_sum / Object.keys(target_sentence_tokens_dict).length;
    console.log("average_ratio_correct: ".concat(average_ratio_correct));
}
exports.grade_mapping_method = grade_mapping_method;
//# sourceMappingURL=wordmap_tools.js.map