"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MorphJLBoostWordMap = exports.JLBoostWordMap = exports.morph_code_prediction_to_feature_dict = exports.morph_code_catboost_cat_feature_order = exports.PlaneWordMap = exports.BoostWordMap = exports.AbstractWordMapWrapper = exports.catboost_feature_order = void 0;
//import {WordMapProps} from "wordmap/core/WordMap"
var wordmap_1 = require("wordmap");
var wordmap_lexer_1 = require("wordmap-lexer");
var wordmap_tools_1 = require("./wordmap_tools");
var JLBoost_1 = require("./JLBoost");
var misc_tools_1 = require("./misc_tools");
exports.catboost_feature_order = [
    "sourceCorpusPermutationsFrequencyRatio",
    "targetCorpusPermutationsFrequencyRatio",
    "sourceAlignmentMemoryFrequencyRatio",
    "targetAlignmentMemoryFrequencyRatio",
    "frequencyRatioCorpusFiltered",
    "frequencyRatioAlignmentMemoryFiltered",
    "sourceCorpusLemmaPermutationsFrequencyRatio",
    "targetCorpusLemmaPermutationsFrequencyRatio",
    "sourceAlignmentMemoryLemmaFrequencyRatio",
    "targetAlignmentMemoryLemmaFrequencyRatio",
    "lemmaFrequencyRatioCorpusFiltered",
    "lemmaFrequencyRatioAlignmentMemoryFiltered",
    "ngramRelativeTokenDistance",
    "alignmentRelativeOccurrence",
    "alignmentPosition",
    "phrasePlausibility",
    "lemmaPhrasePlausibility",
    "ngramLength",
    "characterLength",
    "alignmentOccurrences",
    "lemmaAlignmentOccurrences",
    "uniqueness",
    "lemmaUniqueness",
];
/**
 * Hashes an alignment into a dictionary so connections can be looked up.
 * @param sourceToTargetHash the hash that source to targets are hashed into
 * @param targetToSourceHash the hash that targets to source are hashed into
 * @param alignment the alignment to hash connections from.
 */
function addAlignmentToHashes(sourceToTargetHash, targetToSourceHash, alignment) {
    for (var _i = 0, _a = alignment.sourceNgram.getTokens(); _i < _a.length; _i++) {
        var sourceToken = _a[_i];
        for (var _b = 0, _c = alignment.targetNgram.getTokens(); _b < _c.length; _b++) {
            var targetToken = _c[_b];
            var sourceHash = (0, wordmap_tools_1.token_to_hash)(sourceToken);
            var targetHash = (0, wordmap_tools_1.token_to_hash)(targetToken);
            if (!(sourceHash in sourceToTargetHash))
                sourceToTargetHash[sourceHash] = [];
            if (!(targetHash in targetToSourceHash))
                targetToSourceHash[targetHash] = [];
            sourceToTargetHash[sourceHash].push(targetHash);
            targetToSourceHash[targetHash].push(sourceHash);
        }
    }
}
var AbstractWordMapWrapper = /** @class */ (function () {
    function AbstractWordMapWrapper(opts) {
        //If opts.train_steps is not set, set it to 1000.
        if (!('train_steps' in opts))
            opts["train_steps"] = 1000;
        if (!('learning_rate' in opts))
            opts["learning_rate"] = 0.7;
        if (!('tree_depth' in opts))
            opts["tree_depth"] = 5;
        this.wordMap = new wordmap_1.default(opts);
        this.engine = this.wordMap.engine;
        this.opts = opts;
    }
    AbstractWordMapWrapper.load = function (data) {
        //switch on the data.classType and load the appropriate class
        var loaders = {
            "PlaneWordMap": PlaneWordMap,
            "JLBoostWordMap": JLBoostWordMap,
            "MorphJLBoostWordMap": MorphJLBoostWordMap,
        };
        // First construct it and then call specificLoad on it.
        var MapperConstructor = loaders[data.classType];
        if (!MapperConstructor) {
            throw new Error("Unknown classType: ".concat(data.classType));
        }
        var mapper = new MapperConstructor(data.opts);
        mapper.specificLoad(data);
        return mapper;
    };
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    AbstractWordMapWrapper.prototype.save = function () {
        var result = {
            "wordMap.engine.alignmentMemoryIndex.permutationIndex.alignPermFreqIndex.index": Object.fromEntries(this.wordMap.engine.alignmentMemoryIndex.permutationIndex.alignPermFreqIndex.index),
            "wordMap.engine.alignmentMemoryIndex.permutationIndex.srcNgramPermFreqIndex.index": Object.fromEntries(this.wordMap.engine.alignmentMemoryIndex.permutationIndex.srcNgramPermFreqIndex.index),
            "wordMap.engine.alignmentMemoryIndex.permutationIndex.tgtNgramPermFreqIndex.index": Object.fromEntries(this.wordMap.engine.alignmentMemoryIndex.permutationIndex.tgtNgramPermFreqIndex.index),
            "opts": this.opts,
        };
        return result;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    AbstractWordMapWrapper.prototype.specificLoad = function (data) {
        var _this = this;
        //opts is handled in the constructor.
        Object.entries(data['wordMap.engine.alignmentMemoryIndex.permutationIndex.alignPermFreqIndex.index']).forEach(function (key_value) {
            _this.wordMap.engine.alignmentMemoryIndex.permutationIndex.alignPermFreqIndex.index.set(key_value[0], key_value[1]);
        });
        Object.entries(data['wordMap.engine.alignmentMemoryIndex.permutationIndex.srcNgramPermFreqIndex.index']).forEach(function (key_value) {
            _this.wordMap.engine.alignmentMemoryIndex.permutationIndex.srcNgramPermFreqIndex.index.set(key_value[0], key_value[1]);
        });
        Object.entries(data['wordMap.engine.alignmentMemoryIndex.permutationIndex.tgtNgramPermFreqIndex.index']).forEach(function (key_value) {
            _this.wordMap.engine.alignmentMemoryIndex.permutationIndex.tgtNgramPermFreqIndex.index.set(key_value[0], key_value[1]);
        });
        return this;
    };
    /**
     * Appends alignment memory engine.
     * @param alignments - an alignment or array of alignments
     */
    AbstractWordMapWrapper.prototype.appendAlignmentMemory = function (alignments) {
        this.wordMap.appendAlignmentMemory(alignments);
    };
    AbstractWordMapWrapper.prototype.appendCorpusTokens = function (sourceTokens, targetTokens) {
        this.wordMap.appendCorpusTokens(sourceTokens, targetTokens);
    };
    AbstractWordMapWrapper.prototype.appendKeyedCorpusTokens = function (sourceTokens, targetTokens) {
        this.wordMap.appendCorpusTokens(Object.values(sourceTokens), Object.values(targetTokens));
    };
    /**
     * Predicts the word alignments between the sentences.
     * @param {string} sourceSentence - a sentence from the source text
     * @param {string} targetSentence - a sentence from the target text
     * @param {number} maxSuggestions - the maximum number of suggestions to return
     * @return {Suggestion[]}
    */
    AbstractWordMapWrapper.prototype.predict = function (sourceSentence, targetSentence, maxSuggestions, manuallyAligned) {
        if (manuallyAligned === void 0) { manuallyAligned = []; }
        var sourceTokens = [];
        var targetTokens = [];
        if (typeof sourceSentence === "string") {
            sourceTokens = wordmap_lexer_1.default.tokenize(sourceSentence);
        }
        else {
            sourceTokens = sourceSentence;
        }
        if (typeof targetSentence === "string") {
            targetTokens = wordmap_lexer_1.default.tokenize(targetSentence);
        }
        else {
            targetTokens = targetSentence;
        }
        var engine_run = this.engine.run(sourceTokens, targetTokens);
        this.score_with_context(engine_run, manuallyAligned);
        var predictions = wordmap_1.Engine.sortPredictions(engine_run);
        //return Engine.suggest(predictions, maxSuggestions, (this as any).forceOccurrenceOrder, minConfidence);
        //rolled back to wordmap version 0.6.0 which doesn't have the last two arguments.
        return wordmap_1.Engine.suggest(predictions, maxSuggestions /*, (this as any).forceOccurrenceOrder, minConfidence*/);
    };
    /**
     * The point of this function is for predictions to be made for verses which are already partially aligned.
     * It is used by the predict method to apply the scores with context of the manual mappings.
     * @param suggestedMappings The mappings which need to be graded
     * @param manualMappings The partial mappings which the user has manually aligned.
     */
    AbstractWordMapWrapper.prototype.score_with_context = function (suggestedMappings, manualMappings) {
        //hash the manualMappings so it is easier to look it up.
        var manualMappingSourceToTargetHashes = {};
        var manualMappingTargetToSourceHashes = {};
        for (var _i = 0, manualMappings_1 = manualMappings; _i < manualMappings_1.length; _i++) {
            var manualMapping = manualMappings_1[_i];
            addAlignmentToHashes(manualMappingSourceToTargetHashes, manualMappingTargetToSourceHashes, manualMapping);
        }
        var suggestionsWhichNeedModelScore = [];
        suggestingLoop: for (var suggestedMappingI = 0; suggestedMappingI < suggestedMappings.length; ++suggestedMappingI) {
            var suggestedMapping = suggestedMappings[suggestedMappingI];
            var suggestedMappingSourceToTargetHashes = {};
            var suggestedMappingTargetToSourceHashes = {};
            addAlignmentToHashes(suggestedMappingSourceToTargetHashes, suggestedMappingTargetToSourceHashes, suggestedMapping.alignment);
            //now hash out this suggested mapping.
            //go through every token in both sides of the suggestion,
            //  go through every manual connection which includes this token,
            //    if a connection is found which is not in the original suggestion then the original suggestion is incompatible.
            for (var _a = 0, _b = Object.keys(suggestedMappingSourceToTargetHashes); _a < _b.length; _a++) {
                var suggestionSourceTokenHash = _b[_a];
                if (suggestionSourceTokenHash in manualMappingSourceToTargetHashes) {
                    var suggestedMappingTargetHashes = suggestedMappingSourceToTargetHashes[suggestionSourceTokenHash];
                    for (var _c = 0, _d = manualMappingSourceToTargetHashes[suggestionSourceTokenHash]; _c < _d.length; _c++) {
                        var manualMappingTargetTokenHash = _d[_c];
                        //if this connection doesn't exist in the suggestion, then the suggestion is breaking
                        //connections which the user manually made and is not a valid suggestion.
                        if (!suggestedMappingTargetHashes.includes(manualMappingTargetTokenHash)) {
                            //This is an invalid suggestion so mark the confidence as 0.
                            suggestedMapping.setScore("confidence", 0);
                            continue suggestingLoop;
                        }
                    }
                }
            }
            //now do that again the other way around.
            for (var _e = 0, _f = Object.keys(suggestedMappingTargetToSourceHashes); _e < _f.length; _e++) {
                var suggestionTargetTokenHash = _f[_e];
                if (suggestionTargetTokenHash in manualMappingTargetToSourceHashes) {
                    var suggestedMappingSourceHash = suggestedMappingTargetToSourceHashes[suggestionTargetTokenHash];
                    for (var _g = 0, _h = manualMappingTargetToSourceHashes[suggestionTargetTokenHash]; _g < _h.length; _g++) {
                        var manualMappingSourceTokenHash = _h[_g];
                        //if this connection doesn't exist in the suggestion, then then suggestion is breaking
                        //connections which the user manually made and is not a valid suggestion.
                        if (!suggestedMappingSourceHash.includes(manualMappingSourceTokenHash)) {
                            suggestedMapping.setScore("confidence", 0);
                            continue suggestingLoop;
                        }
                    }
                }
            }
            //now need to check if this suggestion if defined correct by manual mappings.
            var isConnectionSubsetAndNotNullConnection = function (suggestedMappingAToB, manualMappingAToB) {
                //Don't go for just an empty set, because then we prioritize null connections.
                if (Object.keys(suggestedMappingAToB).length === 0)
                    return false;
                for (var _i = 0, _a = Object.entries(suggestedMappingAToB); _i < _a.length; _i++) {
                    var _b = _a[_i], a = _b[0], suggestedBList = _b[1];
                    if (!(a in manualMappingAToB))
                        return false;
                    var manualBList = manualMappingAToB[a];
                    for (var _c = 0, suggestedBList_1 = suggestedBList; _c < suggestedBList_1.length; _c++) {
                        var suggestedB = suggestedBList_1[_c];
                        if (!manualBList.includes(suggestedB))
                            return false;
                    }
                }
                return true;
            };
            //Checking if the suggestion is already aligned by the user and setting the confidence to 1 gives an unintended side effect.
            //If there is an ngram and the user has only added one word of the ngram then that gives the single word an unfair advantage.
            //The ngram will get graded and given a score like .7 while the single word will get a score of 1.  So just marking the
            //incompatible connections with zero is good enough to make the engine produce predictions which are compatible with what
            //the user has manually aligned.
            // if( isConnectionSubsetAndNotNullConnection( suggestedMappingTargetToSourceHashes, manualMappingTargetToSourceHashes ) &&
            //     isConnectionSubsetAndNotNullConnection( suggestedMappingSourceToTargetHashes, manualMappingSourceToTargetHashes ) ){
            //     suggestedMapping.setScore("confidence", 1 );
            //     continue suggestingLoop;
            // }
            //ok, if it isn't a manual no or yes, we need to actually use the predict and return the score for that.
            suggestionsWhichNeedModelScore.push(suggestedMapping);
        }
        this.model_score(suggestionsWhichNeedModelScore);
    };
    return AbstractWordMapWrapper;
}());
exports.AbstractWordMapWrapper = AbstractWordMapWrapper;
var BoostWordMap = /** @class */ (function (_super) {
    __extends(BoostWordMap, _super);
    function BoostWordMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ratio_of_training_data = 1; //The ratio of how much data to use so we can thin data.
        return _this;
    }
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    BoostWordMap.prototype.save = function () {
        var result = __assign(__assign({}, _super.prototype.save.call(this)), { "ratio_of_training_data": this.ratio_of_training_data });
        return result;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    BoostWordMap.prototype.specificLoad = function (data) {
        _super.prototype.specificLoad.call(this, data);
        this.ratio_of_training_data = data["ratio_of_training_data"];
        return this;
    };
    BoostWordMap.prototype.setTrainingRatio = function (ratio_of_training_data) {
        this.ratio_of_training_data = ratio_of_training_data;
    };
    BoostWordMap.prototype.collect_boost_training_data = function (source_text, target_text, alignments, ratio_of_incorrect_to_keep, target_max_alignments) {
        var _this = this;
        if (ratio_of_incorrect_to_keep === void 0) { ratio_of_incorrect_to_keep = .1; }
        if (target_max_alignments === void 0) { target_max_alignments = 1000; }
        var correct_predictions = [];
        var incorrect_predictions = [];
        //if we have too many alignments it takes too long to spin through them.  So if we have more then target_max_alignments
        //we will decimate it down to that amount
        if (Object.keys(alignments).length > target_max_alignments) {
            //shuffle the alignments and then take the first target_max_alignments
            var alignmentsAsArray = Object.entries(alignments);
            //randomize using shuffle function
            (0, misc_tools_1.shuffleArray)(alignmentsAsArray);
            //take the first target_max_alignments
            alignments = Object.fromEntries(alignmentsAsArray.slice(0, target_max_alignments));
        }
        Object.entries(alignments).forEach(function (_a, alignment_i) {
            var key = _a[0], verse_alignments = _a[1];
            //collect every prediction
            var every_prediction = _this.engine.run(source_text[key], target_text[key]);
            //iterate through them
            every_prediction.forEach(function (prediction) {
                //figure out if the prediction is correct
                //If the prediction is correct, include it, if it isn't randomly include it.
                if ((0, wordmap_tools_1.is_correct_prediction)(prediction, verse_alignments)) {
                    correct_predictions.push(prediction);
                }
                else if (Math.random() < ratio_of_incorrect_to_keep * _this.ratio_of_training_data) {
                    incorrect_predictions.push(prediction);
                }
            });
        });
        //return the collected data.
        return [correct_predictions, incorrect_predictions];
    };
    // I don't know if I should produce the gradient boost training on the data on the same data which is stuffed into its alignment memory.  I suppose I can do some tests to figure this out.
    // So one:
    // 1 Do the alignment training with no verses included.  Then add the verses.
    // 2 Do the alignment training with half of the verses included. Then add the remainder.
    // 3 Do the alignment training with all the verses included already.
    // 4 Add the alignment memory for the first half and collect training data for the second half and then reverse to collect the training data for the first half.
    BoostWordMap.prototype.add_alignments_1 = function (source_text, target_text, alignments) {
        // 1 Do the alignment training with no verses included.  Then add the verses.
        var _this = this;
        var _a = this.collect_boost_training_data(source_text, target_text, alignments), correct_predictions = _a[0], incorrect_predictions = _a[1];
        Object.entries(alignments).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            _this.appendAlignmentMemory(verse_alignments);
        });
        return this.do_boost_training(correct_predictions, incorrect_predictions);
    };
    BoostWordMap.prototype.add_alignments_2 = function (source_text, target_text, alignments) {
        var _this = this;
        // 2 Do the alignment training with half of the verses included. Then add the remainder.
        var alignments_split_a = Object.fromEntries(Object.entries(alignments).filter(function (_, i) { return i % 2 === 0; }));
        var alignments_split_b = Object.fromEntries(Object.entries(alignments).filter(function (_, i) { return i % 2 !== 0; }));
        Object.entries(alignments_split_a).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            return _this.appendAlignmentMemory(verse_alignments);
        });
        var _a = this.collect_boost_training_data(source_text, target_text, alignments_split_b), correct_predictions = _a[0], incorrect_predictions = _a[1];
        Object.entries(alignments_split_b).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            return _this.appendAlignmentMemory(verse_alignments);
        });
        return this.do_boost_training(correct_predictions, incorrect_predictions);
    };
    BoostWordMap.prototype.add_alignments_3 = function (source_text, target_text, alignments) {
        // 3 Do the alignment training with all the verses included already.
        var _this = this;
        Object.entries(alignments).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            _this.appendAlignmentMemory(verse_alignments);
        });
        var _a = this.collect_boost_training_data(source_text, target_text, alignments), correct_predictions = _a[0], incorrect_predictions = _a[1];
        return this.do_boost_training(correct_predictions, incorrect_predictions);
    };
    BoostWordMap.prototype.add_alignments_4 = function (source_text, target_text, alignments) {
        // 4 Add the alignment memory for the first half and collect training data for the second half and then reverse to collect the training data for the first half.
        var _this = this;
        //split the alignment data into two groups.
        var alignments_split_a = Object.fromEntries(Object.entries(alignments).filter(function (_, i) { return i % 2 === 0; }));
        var alignments_split_b = Object.fromEntries(Object.entries(alignments).filter(function (_, i) { return i % 2 !== 0; }));
        //Add a and train on b
        Object.entries(alignments_split_a).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            return _this.appendAlignmentMemory(verse_alignments);
        });
        var _a = this.collect_boost_training_data(source_text, target_text, alignments_split_b), correct_predictions_1 = _a[0], incorrect_predictions_1 = _a[1];
        //this.clearAlignmentMemory();  Not in version 0.6.0 which I rolled back to.
        this.engine.alignmentMemoryIndex.clear();
        //now add b and train on a
        Object.entries(alignments_split_b).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            return _this.appendAlignmentMemory(verse_alignments);
        });
        var _b = this.collect_boost_training_data(source_text, target_text, alignments_split_a), correct_predictions_2 = _b[0], incorrect_predictions_2 = _b[1];
        //now train the model on both of them.
        var correct_predictions = correct_predictions_1.concat(correct_predictions_2);
        var incorrect_predictions = incorrect_predictions_1.concat(incorrect_predictions_2);
        return this.do_boost_training(correct_predictions, incorrect_predictions);
    };
    return BoostWordMap;
}(AbstractWordMapWrapper));
exports.BoostWordMap = BoostWordMap;
//The point of this class is to make a way of interacting with WordMap
//which uses the same extended interface of the CatBoostWordMap interface.
var PlaneWordMap = /** @class */ (function (_super) {
    __extends(PlaneWordMap, _super);
    function PlaneWordMap() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlaneWordMap.prototype.setTrainingRatio = function (ratio_of_training_data) { };
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    PlaneWordMap.prototype.save = function () {
        var result = __assign(__assign({}, _super.prototype.save.call(this)), { "classType": "PlaneWordMap" });
        return result;
    };
    PlaneWordMap.prototype.add_alignments_1 = function (source_text, target_text, alignments) {
        var _this = this;
        // In "plane" the different ways of adding are all the same.
        Object.entries(alignments).forEach(function (_a) {
            var verseKey = _a[0], verse_alignments = _a[1];
            return _this.appendAlignmentMemory(verse_alignments);
        });
        //return a thin promise just so that we have the same api as the other.
        return new Promise(function (resolve) { return resolve(); });
    };
    PlaneWordMap.prototype.add_alignments_2 = function (source_text, target_text, alignments) {
        return this.add_alignments_1(source_text, target_text, alignments);
    };
    PlaneWordMap.prototype.add_alignments_3 = function (source_text, target_text, alignments) {
        return this.add_alignments_1(source_text, target_text, alignments);
    };
    PlaneWordMap.prototype.add_alignments_4 = function (source_text, target_text, alignments) {
        return this.add_alignments_1(source_text, target_text, alignments);
    };
    PlaneWordMap.prototype.do_boost_training = function (correct_predictions, incorrect_predictions) {
        //no boost type training in the plane word map.
        return Promise.resolve();
    };
    PlaneWordMap.prototype.model_score = function (predictions) {
        this.engine.score(predictions);
    };
    return PlaneWordMap;
}(AbstractWordMapWrapper));
exports.PlaneWordMap = PlaneWordMap;
exports.morph_code_catboost_cat_feature_order = [
    "src_morph_0",
    "src_morph_1",
    "src_morph_2",
    "src_morph_3",
    "src_morph_4",
    "src_morph_5",
    "src_morph_6",
    "src_morph_7",
];
/**
 * Generates a feature dictionary from a code prediction.
 *
 * @param {Prediction} prediction - The code prediction to generate the feature dictionary from.
 * @return {{[key:string]:(number|string)}} - The generated feature dictionary.
 */
function morph_code_prediction_to_feature_dict(prediction) {
    var result = {};
    var scores = prediction.getScores();
    exports.catboost_feature_order.forEach(function (key) {
        var _a;
        result[key] = (_a = scores[key]) !== null && _a !== void 0 ? _a : 0;
    });
    prediction.alignment.sourceNgram.getTokens().forEach(function (token) {
        token.morph.split(",").forEach(function (morph_piece, morph_index) {
            var categorical_key = "src_morph_".concat(morph_index);
            if (exports.morph_code_catboost_cat_feature_order.includes(categorical_key)) {
                if (!(categorical_key in result)) {
                    result[categorical_key] = '';
                }
                result[categorical_key] += morph_piece;
            }
        });
    });
    exports.morph_code_catboost_cat_feature_order.forEach(function (key) {
        if (!(key in result)) {
            result[key] = "";
        }
    });
    return result;
}
exports.morph_code_prediction_to_feature_dict = morph_code_prediction_to_feature_dict;
function jlboost_prediction_to_feature_dict(prediction) {
    var result = {};
    var scores = prediction.getScores();
    exports.catboost_feature_order.forEach(function (key) {
        var _a;
        result[key] = (_a = scores[key]) !== null && _a !== void 0 ? _a : 0;
    });
    return result;
}
var JLBoostWordMap = /** @class */ (function (_super) {
    __extends(JLBoostWordMap, _super);
    function JLBoostWordMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.jlboost_model = null;
        return _this;
    }
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    JLBoostWordMap.prototype.save = function () {
        var _a;
        var result = __assign(__assign({}, _super.prototype.save.call(this)), { "jlboost_model": (_a = this.jlboost_model) === null || _a === void 0 ? void 0 : _a.save(), "classType": "JLBoostWordMap" });
        return result;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    JLBoostWordMap.prototype.specificLoad = function (data) {
        _super.prototype.specificLoad.call(this, data);
        this.jlboost_model = JLBoost_1.JLBoost.load(data.jlboost_model);
        return this;
    };
    JLBoostWordMap.prototype.model_score = function (predictions) {
        for (var prediction_i = 0; prediction_i < predictions.length; ++prediction_i) {
            var numerical_features = jlboost_prediction_to_feature_dict(predictions[prediction_i]);
            var confidence = this.jlboost_model.predict_single(numerical_features);
            predictions[prediction_i].setScore("confidence", confidence);
        }
    };
    JLBoostWordMap.prototype.do_boost_training = function (correct_predictions, incorrect_predictions) {
        var _this = this;
        //first collect the data to train on.
        var prediction_to_dict = function (prediction, is_correct) {
            var result = {};
            exports.catboost_feature_order.forEach(function (feature_name) {
                var _a;
                try {
                    result[feature_name] = (_a = prediction.getScore(feature_name)) !== null && _a !== void 0 ? _a : 0;
                }
                catch (error) {
                    if (error.message.startsWith("Unknown score key")) {
                        result[feature_name] = 0;
                    }
                    else {
                        throw error; // re-throw the error if it's not the expected error type
                    }
                }
            });
            result["output"] = is_correct ? 1 : 0;
            return result;
        };
        var training_data = correct_predictions.map(function (p) { return prediction_to_dict(p, true); })
            .concat(incorrect_predictions.map(function (p) { return prediction_to_dict(p, false); }));
        this.jlboost_model = new JLBoost_1.JLBoost({ learning_rate: this.opts.learning_rate });
        return new Promise(function (resolve) {
            _this.jlboost_model.train({
                xy_data: training_data,
                y_index: "output",
                n_steps: _this.opts.train_steps,
                tree_depth: _this.opts.tree_depth,
                talk: true,
            });
            resolve();
        });
    };
    return JLBoostWordMap;
}(BoostWordMap));
exports.JLBoostWordMap = JLBoostWordMap;
var MorphJLBoostWordMap = /** @class */ (function (_super) {
    __extends(MorphJLBoostWordMap, _super);
    function MorphJLBoostWordMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.jlboost_model = null;
        return _this;
    }
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    MorphJLBoostWordMap.prototype.save = function () {
        var _a;
        var result = __assign(__assign({}, _super.prototype.save.call(this)), { "jlboost_model": (_a = this.jlboost_model) === null || _a === void 0 ? void 0 : _a.save(), "classType": "MorphJLBoostWordMap" });
        return result;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    MorphJLBoostWordMap.prototype.specificLoad = function (data) {
        _super.prototype.specificLoad.call(this, data);
        this.jlboost_model = JLBoost_1.JLBoost.load(data.jlboost_model);
        return this;
    };
    MorphJLBoostWordMap.prototype.model_score = function (predictions) {
        for (var prediction_i = 0; prediction_i < predictions.length; ++prediction_i) {
            var numerical_features = morph_code_prediction_to_feature_dict(predictions[prediction_i]);
            var confidence = this.jlboost_model.predict_single(numerical_features);
            predictions[prediction_i].setScore("confidence", confidence);
        }
    };
    MorphJLBoostWordMap.prototype.do_boost_training = function (correct_predictions, incorrect_predictions) {
        var _this = this;
        //first collect the data to train on.
        var prediction_to_dict = function (prediction, is_correct) {
            var result = morph_code_prediction_to_feature_dict(prediction);
            result["output"] = is_correct ? 1 : 0;
            return result;
        };
        var training_data = correct_predictions.map(function (p) { return prediction_to_dict(p, true); })
            .concat(incorrect_predictions.map(function (p) { return prediction_to_dict(p, false); }));
        this.jlboost_model = new JLBoost_1.JLBoost({ categorical_catagories: exports.morph_code_catboost_cat_feature_order, learning_rate: this.opts.learning_rate });
        return new Promise(function (resolve) {
            _this.jlboost_model.train({
                xy_data: training_data,
                y_index: "output",
                n_steps: _this.opts.train_steps,
                tree_depth: _this.opts.tree_depth,
                talk: true,
            });
            resolve();
        });
    };
    return MorphJLBoostWordMap;
}(BoostWordMap));
exports.MorphJLBoostWordMap = MorphJLBoostWordMap;
//# sourceMappingURL=boostwordmap_tools.js.map