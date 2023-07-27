declare abstract class BranchOrLeaf {
    abstract predict_single(data: {
        [key: string]: number | string;
    }, categorical_categories: string[]): number;
    abstract predict(xy_data: {
        [key: string]: number | string;
    }[], categorical_categories: string[]): number[];
    abstract to_dict(): {
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
    to_dict(): {
        [key: string]: any;
    };
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
    to_dict(): {
        [key: string]: any;
    };
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
    predict(xy_data: {
        [key: string]: number | string;
    }[]): any;
    predict_single(data: {
        [key: string]: number | string;
    }): number;
    train({ xy_data, y_index, n_steps, tree_depth, talk, }: JLBoost__train__NamedParameters): JLBoost;
}
export {};
