declare abstract class BranchOrLeaf {
    abstract predict_single(data: {
        [key: string]: number | string;
    }, categorical_categories: string[]): number;
    abstract predict(xy_data: {
        [key: string]: number | string;
    }[], categorical_categories: string[]): number[];
    abstract save(): {
        [key: string]: any;
    };
}
export declare class TreeLeaf extends BranchOrLeaf {
    private average;
    constructor(average: number);
    predict_single(data: {
        [key: string]: number | string;
    }, categorical_categories: string[]): number;
    predict(xy_data: {
        [key: string]: number | string;
    }[], categorical_categories: string[]): number[];
    save(): {
        [key: string]: any;
    };
    /**
    * This is a static function which loads from a structure which is JSON-able.
    */
    static load(data: {
        [key: string]: any;
    }): TreeLeaf;
}
interface TreeBranch__random_tree__NamedParameters {
    xy_data: {
        [key: string]: number | string;
    }[];
    num_levels: number;
    y_index: string;
    ignored_categories: string[];
    categorical_categories: string[];
}
export declare class TreeBranch extends BranchOrLeaf {
    private left_side;
    private right_side;
    feature_index: string | null;
    split_value: any | null;
    constructor();
    /**
     * Saves the current state of the object as a key-value pair object.
     *
     * @return {{[key:string]:any}} The key-value pair object representing the state of the object.
     */
    save(): {
        [key: string]: any;
    };
    /**
     * This is a static function which loads from a structure which is JSON-able.
     */
    static load(data: {
        [key: string]: any;
    }): BranchOrLeaf;
    predict_single(data: {
        [key: string]: number | string;
    }, categorical_categories: string[]): number;
    predict(xy_data: {
        [key: string]: number | string;
    }[], categorical_categories: string[]): number[];
    random_tree({ xy_data, num_levels, y_index, ignored_categories, categorical_categories, }: TreeBranch__random_tree__NamedParameters): BranchOrLeaf;
}
interface JLBoost__train__NamedParameters {
    xy_data: {
        [key: string]: number | string;
    }[];
    y_index: string;
    n_steps: number;
    tree_depth: number;
    talk: boolean;
}
interface JLBoost__constructor__NamedParameters {
    learning_rate?: number;
    categorical_catagories?: string[];
}
export declare class JLBoost {
    trees: TreeBranch[];
    learning_rate: number;
    categorical_categories: string[];
    constructor({ learning_rate, categorical_catagories }: JLBoost__constructor__NamedParameters);
    /**
     * This function saves the state of JLBoost to a structure which is JSON-able
     * and can be loaded later using restore.
     */
    save(): {
        trees: {
            [key: string]: any;
        }[];
        learning_rate: number;
        categorical_categories: string[];
    };
    /**
     * This is a static function which loads from a structure which is JSON-able.
     */
    static load(data: {
        [key: string]: any;
    }): JLBoost;
    predict(xy_data: {
        [key: string]: number | string;
    }[]): any;
    predict_single(data: {
        [key: string]: number | string;
    }): number;
    train({ xy_data, y_index, n_steps, tree_depth, talk, }: JLBoost__train__NamedParameters): JLBoost;
}
export {};
