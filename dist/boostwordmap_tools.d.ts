import { Alignment, Suggestion, Prediction, Engine } from 'wordmap';
import { Token } from "wordmap-lexer";
import { JLBoost } from "./JLBoost";
export declare const catboost_feature_order: string[];
export declare abstract class AbstractWordMapWrapper {
    private wordMap;
    engine: Engine;
    constructor(opts?: {});
    /**
     * Appends alignment memory engine.
     * @param alignments - an alignment or array of alignments
     */
    appendAlignmentMemory(alignments: Alignment | Alignment[]): void;
    /**
     * Predicts the word alignments between the sentences.
     * @param {string} sourceSentence - a sentence from the source text
     * @param {string} targetSentence - a sentence from the target text
     * @param {number} maxSuggestions - the maximum number of suggestions to return
     * @return {Suggestion[]}
    */
    predict(sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number): Suggestion[];
}
export declare abstract class BoostWordMap extends AbstractWordMapWrapper {
    protected ratio_of_training_data: number;
    setTrainingRatio(ratio_of_training_data: number): void;
    abstract catboost_score(predictions: Prediction[]): Prediction[];
    collect_boost_training_data(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }, ratio_of_incorrect_to_keep?: number): [Prediction[], Prediction[]];
    abstract do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
    add_alignments_1(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_2(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_3(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_4(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    /**
     * Predicts the word alignments between the sentences.
     * @param {string} sourceSentence - a sentence from the source text
     * @param {string} targetSentence - a sentence from the target text
     * @param {number} maxSuggestions - the maximum number of suggestions to return
     * @param minConfidence - the minimum confidence score required for a prediction to be used
     * @return {Suggestion[]}
     */
    predict(sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, minConfidence?: number): Suggestion[];
}
export declare class PlaneWordMap extends AbstractWordMapWrapper {
    setTrainingRatio(ratio_of_training_data: number): void;
    add_alignments_1(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_2(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_3(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    add_alignments_4(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }): Promise<void>;
    do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
}
export declare const morph_code_catboost_cat_feature_order: string[];
/**
 * Generates a feature dictionary from a code prediction.
 *
 * @param {Prediction} prediction - The code prediction to generate the feature dictionary from.
 * @return {{[key:string]:(number|string)}} - The generated feature dictionary.
 */
export declare function morph_code_prediction_to_feature_dict(prediction: Prediction): {
    [key: string]: (number | string);
};
export declare class JLBoostWordMap extends BoostWordMap {
    protected jlboost_model: JLBoost | null;
    catboost_score(predictions: Prediction[]): Prediction[];
    do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
}
export declare class JLBoostMultiWordMap extends JLBoostWordMap {
    collect_boost_training_data(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }, ratio_of_incorrect_to_keep?: number): [Prediction[], Prediction[]];
    catboost_score(predictions: Prediction[]): Prediction[];
    /**
 * Predicts the word alignments between the sentences.
 * @param {string} sourceSentence - a sentence from the source text
 * @param {string} targetSentence - a sentence from the target text
 * @param {number} maxSuggestions - the maximum number of suggestions to return
 * @param minConfidence - the minimum confidence score required for a prediction to be used
 * @return {Suggestion[]}
 */
    predict(sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, minConfidence?: number): Suggestion[];
}
export declare class JLBoostMultiWordMap2 extends JLBoostWordMap {
    collect_boost_training_data(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }, ratio_of_incorrect_to_keep?: number): [Prediction[], Prediction[]];
    catboost_score(predictions: Prediction[]): Prediction[];
    /**
 * Predicts the word alignments between the sentences.
 * @param {string} sourceSentence - a sentence from the source text
 * @param {string} targetSentence - a sentence from the target text
 * @param {number} maxSuggestions - the maximum number of suggestions to return
 * @param minConfidence - the minimum confidence score required for a prediction to be used
 * @return {Suggestion[]}
 */
    predict(sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, minConfidence?: number): Suggestion[];
}
export declare class MorphJLBoostWordMap extends BoostWordMap {
    protected jlboost_model: JLBoost | null;
    catboost_score(predictions: Prediction[]): Prediction[];
    do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
}
