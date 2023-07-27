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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MorphJLBoostWordMap = exports.JLBoostMultiWordMap2 = exports.JLBoostMultiWordMap = exports.JLBoostWordMap = exports.morph_code_prediction_to_feature_dict = exports.morph_code_catboost_cat_feature_order = exports.PlaneWordMap = exports.BoostWordMap = exports.AbstractWordMapWrapper = exports.catboost_feature_order = void 0;
//import {WordMapProps} from "wordmap/core/WordMap"
var wordmap_1 = require("wordmap");
var wordmap_lexer_1 = require("wordmap-lexer");
var wordmap_tools_1 = require("./wordmap_tools");
var JLBoost_1 = require("./JLBoost");
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
var AbstractWordMapWrapper = /** @class */ (function (_super) {
    __extends(AbstractWordMapWrapper, _super);
    //constructor(opts?: WordMapProps){
    function AbstractWordMapWrapper(opts) {
        return _super.call(this, opts) || this;
    }
    return AbstractWordMapWrapper;
}(wordmap_1.default));
exports.AbstractWordMapWrapper = AbstractWordMapWrapper;
var BoostWordMap = /** @class */ (function (_super) {
    __extends(BoostWordMap, _super);
    function BoostWordMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ratio_of_training_data = 1; //The ratio of how much data to use so we can thin data.
        return _this;
    }
    BoostWordMap.prototype.setTrainingRatio = function (ratio_of_training_data) {
        this.ratio_of_training_data = ratio_of_training_data;
    };
    BoostWordMap.prototype.collect_boost_training_data = function (source_text, target_text, alignments, ratio_of_incorrect_to_keep) {
        var _this = this;
        if (ratio_of_incorrect_to_keep === void 0) { ratio_of_incorrect_to_keep = .1; }
        var correct_predictions = [];
        var incorrect_predictions = [];
        Object.entries(alignments).forEach(function (_a) {
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
    /**
     * Predicts the word alignments between the sentences.
     * @param {string} sourceSentence - a sentence from the source text
     * @param {string} targetSentence - a sentence from the target text
     * @param {number} maxSuggestions - the maximum number of suggestions to return
     * @param minConfidence - the minimum confidence score required for a prediction to be used
     * @return {Suggestion[]}
     */
    BoostWordMap.prototype.predict = function (sourceSentence, targetSentence, maxSuggestions, minConfidence) {
        if (maxSuggestions === void 0) { maxSuggestions = 1; }
        if (minConfidence === void 0) { minConfidence = 0.1; }
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
        var predictions = this.catboost_score(engine_run);
        //return Engine.suggest(predictions, maxSuggestions, (this as any).forceOccurrenceOrder, minConfidence);
        //rolled back to wordmap version 0.6.0 which doesn't have the last two arguments.
        return wordmap_1.Engine.suggest(predictions, maxSuggestions /*, (this as any).forceOccurrenceOrder, minConfidence*/);
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
    JLBoostWordMap.prototype.catboost_score = function (predictions) {
        for (var prediction_i = 0; prediction_i < predictions.length; ++prediction_i) {
            var numerical_features = jlboost_prediction_to_feature_dict(predictions[prediction_i]);
            var confidence = this.jlboost_model.predict_single(numerical_features);
            predictions[prediction_i].setScore("confidence", confidence);
        }
        return wordmap_1.Engine.sortPredictions(predictions);
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
        this.jlboost_model = new JLBoost_1.JLBoost({});
        return new Promise(function (resolve) {
            _this.jlboost_model.train({
                xy_data: training_data,
                y_index: "output",
                n_steps: 1000,
                tree_depth: 12,
                //tree_depth:2,
                talk: true,
            });
            resolve();
        });
    };
    return JLBoostWordMap;
}(BoostWordMap));
exports.JLBoostWordMap = JLBoostWordMap;
var JLBoostMultiWordMap = /** @class */ (function (_super) {
    __extends(JLBoostMultiWordMap, _super);
    function JLBoostMultiWordMap() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    //collect_boost_training_data needs to not use is_correct_prediction but something like is_sub_correct_prediction
    JLBoostMultiWordMap.prototype.collect_boost_training_data = function (source_text, target_text, alignments, ratio_of_incorrect_to_keep) {
        var _this = this;
        if (ratio_of_incorrect_to_keep === void 0) { ratio_of_incorrect_to_keep = .1; }
        var correct_predictions = [];
        var incorrect_predictions = [];
        Object.entries(alignments).forEach(function (_a) {
            var key = _a[0], verse_alignments = _a[1];
            //collect every prediction
            var every_prediction = _this.engine.run(source_text[key], target_text[key]);
            //iterate through them
            every_prediction.forEach(function (prediction) {
                //figure out if the prediction is correct
                //If the prediction is correct, include it, if it isn't randomly include it.
                if (prediction.target.getTokens().length != 1 || prediction.source.getTokens().length != 1) {
                    //Filter out ngrams greater then 1.
                }
                else if ((0, wordmap_tools_1.is_part_of_correct_prediction)(prediction, verse_alignments)) {
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
    //catboost_score needs to be changed to not just return what was given but instead assemble it into ngrams.
    JLBoostMultiWordMap.prototype.catboost_score = function (predictions) {
        var _this = this;
        //first filter to just single token predictions.
        var just_singles = predictions.filter(function (p) { return p.target.getTokens().length == 1 && p.source.getTokens().length == 1; });
        //now run the set score on all of them.
        just_singles.forEach(function (p) {
            var numerical_features = jlboost_prediction_to_feature_dict(p);
            var confidence = _this.jlboost_model.predict_single(numerical_features);
            p.setScore("confidence", confidence);
        });
        return just_singles;
    };
    /**
 * Predicts the word alignments between the sentences.
 * @param {string} sourceSentence - a sentence from the source text
 * @param {string} targetSentence - a sentence from the target text
 * @param {number} maxSuggestions - the maximum number of suggestions to return
 * @param minConfidence - the minimum confidence score required for a prediction to be used
 * @return {Suggestion[]}
 */
    JLBoostMultiWordMap.prototype.predict = function (sourceSentence, targetSentence, maxSuggestions, minConfidence) {
        if (maxSuggestions === void 0) { maxSuggestions = 1; }
        if (minConfidence === void 0) { minConfidence = 0.1; }
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
        var predictions = this.catboost_score(engine_run);
        var ngram_predictions = create_ngram_predictions(predictions);
        var suggestion = ngram_predictions.reduce(function (s, p) {
            s.addPrediction(p);
            return s;
        }, new wordmap_1.Suggestion());
        return [suggestion];
    };
    return JLBoostMultiWordMap;
}(JLBoostWordMap));
exports.JLBoostMultiWordMap = JLBoostMultiWordMap;
//This version is the same as JLBoostMultiWordMap except that it includes the ngram output of wordmap
//as extra information.
var JLBoostMultiWordMap2 = /** @class */ (function (_super) {
    __extends(JLBoostMultiWordMap2, _super);
    function JLBoostMultiWordMap2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    //collect_boost_training_data needs to not use is_correct_prediction but something like is_sub_correct_prediction
    JLBoostMultiWordMap2.prototype.collect_boost_training_data = function (source_text, target_text, alignments, ratio_of_incorrect_to_keep) {
        var _this = this;
        if (ratio_of_incorrect_to_keep === void 0) { ratio_of_incorrect_to_keep = .1; }
        var correct_predictions = [];
        var incorrect_predictions = [];
        Object.entries(alignments).forEach(function (_a) {
            var key = _a[0], verse_alignments = _a[1];
            //collect every prediction
            var every_prediction = _this.engine.run(source_text[key], target_text[key]);
            //iterate through them
            every_prediction.forEach(function (prediction) {
                //Don't grade a null assignment as correct unless it is right.
                //subset doesn't count.
                var is_null_suggestion = (prediction.target.tokenLength === 0 || prediction.source.tokenLength === 0);
                var is_correct = is_null_suggestion ?
                    (0, wordmap_tools_1.is_correct_prediction)(prediction, verse_alignments) :
                    (0, wordmap_tools_1.is_part_of_correct_prediction)(prediction, verse_alignments);
                if (is_correct) {
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
    //catboost_score needs to be changed to not just return what was given but instead assemble it into ngrams.
    JLBoostMultiWordMap2.prototype.catboost_score = function (predictions) {
        var _this = this;
        //now run the set score on all of them.
        predictions.forEach(function (p) {
            var numerical_features = jlboost_prediction_to_feature_dict(p);
            var confidence = _this.jlboost_model.predict_single(numerical_features);
            p.setScore("confidence", confidence);
        });
        return predictions;
    };
    /**
 * Predicts the word alignments between the sentences.
 * @param {string} sourceSentence - a sentence from the source text
 * @param {string} targetSentence - a sentence from the target text
 * @param {number} maxSuggestions - the maximum number of suggestions to return
 * @param minConfidence - the minimum confidence score required for a prediction to be used
 * @return {Suggestion[]}
 */
    JLBoostMultiWordMap2.prototype.predict = function (sourceSentence, targetSentence, maxSuggestions, minConfidence) {
        if (maxSuggestions === void 0) { maxSuggestions = 1; }
        if (minConfidence === void 0) { minConfidence = 0.1; }
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
        var predictions = this.catboost_score(engine_run);
        var ngram_predictions = create_ngram_predictions(predictions);
        var suggestion = ngram_predictions.reduce(function (s, p) {
            s.addPrediction(p);
            return s;
        }, new wordmap_1.Suggestion());
        return [suggestion];
    };
    return JLBoostMultiWordMap2;
}(JLBoostWordMap));
exports.JLBoostMultiWordMap2 = JLBoostMultiWordMap2;
var LinkGroup = /** @class */ (function () {
    function LinkGroup() {
        this.source_members = [];
        this.target_members = [];
        this.token_links = {};
    }
    LinkGroup.prototype.ngram_max_size = function () {
        return Math.max(this.source_members.length, this.target_members.length);
    };
    LinkGroup.prototype.add_links = function (source, links) {
        var _a;
        if (!(source in this.source_members)) {
            this.source_members.push(source);
        }
        for (var _i = 0, links_1 = links; _i < links_1.length; _i++) {
            var link = links_1[_i];
            if (!this.target_members.includes(link.target)) {
                this.target_members.push(link.target);
            }
        }
        if (!(source in this.token_links)) {
            this.token_links[source] = [];
        }
        (_a = this.token_links[source]).push.apply(_a, links);
    };
    LinkGroup.prototype.split = function () {
        //find whatever link is the weakest but isn't the last connection to 
        //a node or source and then break it.
        var source_link_counts = {};
        var target_link_counts = {};
        for (var _i = 0, _a = Object.entries(this.token_links); _i < _a.length; _i++) {
            var _b = _a[_i], source = _b[0], links = _b[1];
            for (var _c = 0, links_2 = links; _c < links_2.length; _c++) {
                var link = links_2[_c];
                source_link_counts[source] = 1 + (source_link_counts[source] || 0);
                target_link_counts[link.target] = 1 + (target_link_counts[link.target] || 0);
            }
        }
        //figure out what links if removed would not produce an unpaired word.
        var expendable_links = {};
        for (var _d = 0, _e = Object.entries(this.token_links); _d < _e.length; _d++) {
            var _f = _e[_d], source = _f[0], links = _f[1];
            if (source_link_counts[source] > 1) {
                for (var _g = 0, links_3 = links; _g < links_3.length; _g++) {
                    var link = links_3[_g];
                    if (target_link_counts[link.target] > 1) {
                        if (!(source in expendable_links)) {
                            expendable_links[source] = [];
                        }
                        expendable_links[source].push(link);
                    }
                }
            }
        }
        var weakest_source = null;
        var weakest_target = null;
        var weakest_strength = 0;
        for (var _h = 0, _j = Object.entries(expendable_links); _h < _j.length; _h++) {
            var _k = _j[_h], source = _k[0], links = _k[1];
            for (var _l = 0, links_4 = links; _l < links_4.length; _l++) {
                var link = links_4[_l];
                if (weakest_source === null || link.strength < weakest_strength) {
                    weakest_source = source;
                    weakest_target = link.target;
                    weakest_strength = link.strength;
                }
            }
        }
        var links_without_weakest = {};
        for (var _m = 0, _o = Object.entries(this.token_links); _m < _o.length; _m++) {
            var _p = _o[_m], source = _p[0], links = _p[1];
            //if the source doesn't match or we have already broken a link, just copy all the links.
            if (source !== weakest_source) {
                links_without_weakest[source] = links;
            }
            else {
                //if the source does match, drop the first link matching the selected strength.
                links_without_weakest[source] = [];
                for (var _q = 0, links_5 = links; _q < links_5.length; _q++) {
                    var link = links_5[_q];
                    if (link.strength != weakest_strength || link.target !== weakest_target) {
                        links_without_weakest[source].push(link);
                    }
                }
            }
        }
        //Don't worry if the group didn't actually get split, it is closer to being split.
        return determine_groups(links_without_weakest);
    };
    return LinkGroup;
}());
function recursive_get_group_owner(group_owner, key) {
    if (!(key in group_owner))
        return key;
    var owner = group_owner[key];
    if (owner != key) {
        owner = recursive_get_group_owner(group_owner, owner);
        group_owner[key] = owner;
    }
    return owner;
}
function link_groups(group_owner, key1, key2) {
    var owner1 = recursive_get_group_owner(group_owner, key1);
    var owner2 = recursive_get_group_owner(group_owner, key2);
    group_owner[owner1] = owner2;
}
function determine_groups(token_links) {
    var link_valid_threshold = .5;
    var group_owner = {};
    for (var _i = 0, _a = Object.entries(token_links); _i < _a.length; _i++) {
        var _b = _a[_i], source = _b[0], links = _b[1];
        for (var _c = 0, links_6 = links; _c < links_6.length; _c++) {
            var link = links_6[_c];
            if (link.strength > link_valid_threshold) {
                link_groups(group_owner, "s:".concat(source), "t:".concat(link.target));
            }
        }
    }
    var labeled_groups = {};
    var _loop_1 = function (source, links) {
        var group_name = recursive_get_group_owner(group_owner, "s:".concat(source));
        var non_broken_links = links.filter(function (link) { return group_name == recursive_get_group_owner(group_owner, "t:".concat(link.target)); });
        //now only make a group for this if it has any remaining links.
        if (non_broken_links.length > 0) {
            if (!(group_name in labeled_groups)) {
                labeled_groups[group_name] = new LinkGroup();
            }
            //add all the links which stay in this group.  We have a link-valid_threshold and
            //these need to be broken 
            labeled_groups[group_name].add_links(source, non_broken_links);
        }
    };
    for (var _d = 0, _e = Object.entries(token_links); _d < _e.length; _d++) {
        var _f = _e[_d], source = _f[0], links = _f[1];
        _loop_1(source, links);
    }
    return Object.values(labeled_groups);
}
function break_into_groups(token_links, max_ngram_size) {
    if (max_ngram_size === void 0) { max_ngram_size = 4; }
    var to_process = determine_groups(token_links);
    var result = [];
    //keep breaking apart the groups until they are all below ngram size of max_ngram_size
    while (to_process.length > 0) {
        var link_group = to_process.pop();
        if (link_group.ngram_max_size() <= max_ngram_size || link_group.source_members.length < 2 || link_group.target_members.length < 2) {
            result.push(link_group);
        }
        else {
            to_process.push.apply(to_process, link_group.split());
        }
    }
    return result;
}
function token_to_hash(t) {
    return "".concat(t.toString(), ":").concat(t.occurrence, ":").concat(t.occurrences);
}
function dedup_hash_links(hash_links) {
    var source_target_hashed = {};
    Object.entries(hash_links).forEach(function (_a) {
        var source = _a[0], links = _a[1];
        links.forEach(function (link) {
            var source_target_key = "".concat(source, "->").concat(link.target);
            //take only the strongest link.
            if (!(source_target_key in source_target_hashed) || source_target_hashed[source_target_key].strength < link.strength) {
                source_target_hashed[source_target_key] = {
                    source: source,
                    strength: link.strength,
                    target: link.target
                };
            }
        });
    });
    //now convert the format back.
    var result = {};
    Object.values(source_target_hashed).forEach(function (link) {
        if (!(link.source in result)) {
            result[link.source] = [];
        }
        result[link.source].push({
            strength: link.strength,
            target: link.target
        });
    });
    return result;
}
function create_ngram_predictions(scored_predictions) {
    var source_token_hashes = {};
    var target_token_hashes = {};
    var token_hash_links_with_dupes = {};
    scored_predictions.forEach(function (p) {
        p.source.getTokens().forEach(function (t) { return source_token_hashes[token_to_hash(t)] = t; });
        p.target.getTokens().forEach(function (t) { return target_token_hashes[token_to_hash(t)] = t; });
        p.source.getTokens().forEach(function (source) {
            p.target.getTokens().forEach(function (target) {
                var source_hash = token_to_hash(source);
                if (!(source_hash in token_hash_links_with_dupes)) {
                    token_hash_links_with_dupes[source_hash] = [];
                }
                token_hash_links_with_dupes[source_hash].push({
                    strength: p.getScore("confidence"),
                    target: token_to_hash(target)
                });
            });
        });
    });
    var token_hash_links_deduped = dedup_hash_links(token_hash_links_with_dupes);
    var link_groups = break_into_groups(token_hash_links_deduped);
    var result = [];
    for (var _i = 0, link_groups_1 = link_groups; _i < link_groups_1.length; _i++) {
        var link_group = link_groups_1[_i];
        var source_tokens = link_group.source_members.map(function (token_hash) { return source_token_hashes[token_hash]; });
        var target_tokens = link_group.target_members.map(function (token_hash) { return target_token_hashes[token_hash]; });
        result.push(new wordmap_1.Prediction(new wordmap_1.Alignment(new wordmap_1.Ngram(source_tokens), new wordmap_1.Ngram(target_tokens))));
    }
    return result;
}
var MorphJLBoostWordMap = /** @class */ (function (_super) {
    __extends(MorphJLBoostWordMap, _super);
    function MorphJLBoostWordMap() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.jlboost_model = null;
        return _this;
    }
    MorphJLBoostWordMap.prototype.catboost_score = function (predictions) {
        for (var prediction_i = 0; prediction_i < predictions.length; ++prediction_i) {
            var numerical_features = morph_code_prediction_to_feature_dict(predictions[prediction_i]);
            var confidence = this.jlboost_model.predict_single(numerical_features);
            predictions[prediction_i].setScore("confidence", confidence);
        }
        return wordmap_1.Engine.sortPredictions(predictions);
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
        this.jlboost_model = new JLBoost_1.JLBoost({ categorical_catagories: exports.morph_code_catboost_cat_feature_order });
        return new Promise(function (resolve) {
            _this.jlboost_model.train({
                xy_data: training_data,
                y_index: "output",
                n_steps: 1000,
                tree_depth: 12,
                //tree_depth:2,
                talk: true,
            });
            resolve();
        });
    };
    return MorphJLBoostWordMap;
}(BoostWordMap));
exports.MorphJLBoostWordMap = MorphJLBoostWordMap;
//# sourceMappingURL=boostwordmap_tools.js.map