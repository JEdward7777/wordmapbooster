import WordMap, { Alignment, Suggestion, Prediction, Engine } from 'wordmap';
import { Token } from "wordmap-lexer";
import { JLBoost } from "./JLBoost";
export declare const catboost_feature_order: string[];
export declare abstract class AbstractWordMapWrapper {
    protected wordMap: WordMap;
    engine: Engine;
    protected opts: any;
    protected alignmentStash: Alignment[];
    protected sourceCorpusStash: Token[][];
    protected targetCorpusStash: Token[][];
    static load(data: {
        [key: string]: any;
    }): AbstractWordMapWrapper;
    constructor(opts?: {});
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    save(): {
        [key: string]: any;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    specificLoad(data: any): AbstractWordMapWrapper;
    /**
     * Appends alignment memory engine.  This is protected because the add_alignments_2 or add_alignments_4 should be used instead.
     * @param alignments - an alignment or array of alignments
     */
    protected appendAlignmentMemory(alignments: Alignment | Alignment[]): void;
    appendCorpusTokens(sourceTokens: Token[][], targetTokens: Token[][]): void;
    appendKeyedCorpusTokens(sourceTokens: {
        [key: string]: Token[];
    }, targetTokens: {
        [key: string]: Token[];
    }): void;
    /**
     * Predicts the word alignments between the sentences.
     * @param {string} sourceSentence - a sentence from the source text
     * @param {string} targetSentence - a sentence from the target text
     * @param {number} maxSuggestions - the maximum number of suggestions to return
     * @return {Suggestion[]}
    */
    predict(sourceSentence: string | Token[], targetSentence: string | Token[], maxSuggestions?: number, manuallyAligned?: Alignment[]): Suggestion[];
    /**
     * This is overridden by the different models to grade predictions in their own way.
     * @param predictions the predictions which will get a score put in them.
     */
    protected abstract model_score(predictions: Prediction[]): void;
    /**
     * The point of this function is for predictions to be made for verses which are already partially aligned.
     * It is used by the predict method to apply the scores with context of the manual mappings.
     * @param suggestedMappings The mappings which need to be graded
     * @param manualMappings The partial mappings which the user has manually aligned.
     */
    protected score_with_context(suggestedMappings: Prediction[], manualMappings: Alignment[]): void;
}
export declare abstract class BoostWordMap extends AbstractWordMapWrapper {
    protected ratio_of_training_data: number;
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    save(): {
        [key: string]: any;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    specificLoad(data: any): AbstractWordMapWrapper;
    setTrainingRatio(ratio_of_training_data: number): void;
    collect_boost_training_data(source_text: {
        [key: string]: Token[];
    }, target_text: {
        [key: string]: Token[];
    }, alignments: {
        [key: string]: Alignment[];
    }, ratio_of_incorrect_to_keep?: number, target_max_alignments?: number): [Prediction[], Prediction[]];
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
}
export declare class PlaneWordMap extends AbstractWordMapWrapper {
    setTrainingRatio(ratio_of_training_data: number): void;
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    save(): {
        [key: string]: any;
    };
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
    protected model_score(predictions: Prediction[]): void;
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
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    save(): {
        [key: string]: any;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    specificLoad(data: any): AbstractWordMapWrapper;
    model_score(predictions: Prediction[]): void;
    do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
}
export declare class MorphJLBoostWordMap extends BoostWordMap {
    protected jlboost_model: JLBoost | null;
    /**
     * Saves the model to a json-able structure.
     * @returns {Object}
     */
    save(): {
        [key: string]: any;
    };
    /**
     * This is an abstract method which loads from a structure which is JSON-able.
     * @param data - the data to load
     */
    specificLoad(data: any): AbstractWordMapWrapper;
    model_score(predictions: Prediction[]): void;
    do_boost_training(correct_predictions: Prediction[], incorrect_predictions: Prediction[]): Promise<void>;
}
