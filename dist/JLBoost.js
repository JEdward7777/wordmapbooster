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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JLBoost = exports.TreeBranch = exports.TreeLeaf = void 0;
var range = function (n, offset) {
    return Array.from(Array(n).keys()).map(function (n) { return n + offset; });
};
var BranchOrLeaf = /** @class */ (function () {
    function BranchOrLeaf() {
    }
    return BranchOrLeaf;
}());
var TreeLeaf = /** @class */ (function (_super) {
    __extends(TreeLeaf, _super);
    function TreeLeaf(average) {
        var _this = _super.call(this) || this;
        _this.average = average;
        return _this;
    }
    TreeLeaf.prototype.predict_single = function (data, categorical_categories) {
        return this.average;
    };
    TreeLeaf.prototype.predict = function (xy_data, categorical_categories) {
        var _this = this;
        return __spreadArray([], Array(xy_data.length), true).map(function () { return _this.average; });
    };
    TreeLeaf.prototype.to_dict = function () {
        return { 'average': this.average };
    };
    return TreeLeaf;
}(BranchOrLeaf));
exports.TreeLeaf = TreeLeaf;
var MIDDLE_SPLIT_FAVOR = 0.25;
var TreeBranch = /** @class */ (function (_super) {
    __extends(TreeBranch, _super);
    function TreeBranch() {
        var _this = _super.call(this) || this;
        _this.left_side = null;
        _this.right_side = null;
        _this.feature_index = null;
        _this.split_value = null;
        return _this;
    }
    TreeBranch.prototype.to_dict = function () {
        var result = {};
        result['feature_index'] = this.feature_index;
        result['split_value'] = this.split_value;
        result['left_side'] = this.left_side.to_dict();
        result['right_side'] = this.right_side.to_dict();
        return result;
    };
    TreeBranch.prototype.predict_single = function (data, categorical_categories) {
        var follow_left_side = false;
        //see if we are a categorical split or a numerical split.
        if (categorical_categories.includes(this.feature_index)) {
            follow_left_side = data[this.feature_index] === this.split_value;
        }
        else {
            follow_left_side = data[this.feature_index] <= this.split_value;
        }
        return (follow_left_side) ?
            this.left_side.predict_single(data, categorical_categories) :
            this.right_side.predict_single(data, categorical_categories);
    };
    TreeBranch.prototype.predict = function (xy_data, categorical_categories) {
        var _this = this;
        return xy_data.map(function (row) { return _this.predict_single(row, categorical_categories); });
    };
    TreeBranch.prototype.random_tree = function (_a) {
        var _this = this;
        var xy_data = _a.xy_data, num_levels = _a.num_levels, y_index = _a.y_index, ignored_categories = _a.ignored_categories, categorical_categories = _a.categorical_categories;
        //assuming the keys on the first object are representative.
        var categories = Object.keys(xy_data[0]).filter(function (category) { return category !== y_index && !ignored_categories.includes(category); });
        var xy_data_sorted = [];
        var first_of_right_hand = 0;
        var length = xy_data.length;
        //check if there are any categories left
        if (categories.length > 0) {
            //Randomly select a category
            var randomCategoryIndex = Math.floor(Math.random() * categories.length);
            this.feature_index = categories[randomCategoryIndex];
            //determine if this is a categorical category or not.
            if (categorical_categories.includes(this.feature_index)) {
                var available_options = xy_data.reduce(function (choices, choice) { return choices.includes(choice[_this.feature_index]) ? choices : __spreadArray(__spreadArray([], choices, true), [choice[_this.feature_index]], false); }, []);
                var selected_option_i = Math.floor(Math.random() * available_options.length);
                this.split_value = available_options[selected_option_i];
                //we now need to sort so that the selected option is at the front and everything else is not.
                var haves_1 = [];
                var have_nots_1 = [];
                xy_data.forEach(function (sample) {
                    if (sample[_this.feature_index] === _this.split_value) {
                        haves_1.push(sample);
                    }
                    else {
                        have_nots_1.push(sample);
                    }
                });
                xy_data_sorted = haves_1.concat(have_nots_1);
                first_of_right_hand = haves_1.length;
            }
            else {
                first_of_right_hand = Math.min(Math.max(Math.floor(Math.random() * length), 1), length - 1);
                // Sort the section by the selected feature index
                xy_data_sorted = xy_data.slice();
                xy_data_sorted.sort(function (a, b) { return a[_this.feature_index] - b[_this.feature_index]; });
                //determine our split value from the randomly hit split location.
                this.split_value =
                    0.5 *
                        (xy_data_sorted[first_of_right_hand - 1][this.feature_index] +
                            xy_data_sorted[first_of_right_hand][this.feature_index]);
            }
        }
        //check for a degenerate split.
        var result = this;
        if (first_of_right_hand == 0 || first_of_right_hand == length) {
            //if we have depth left just try growing a new branch.
            if (num_levels > 1) {
                //we set our return result to the new random_tree which excludes ourselves (this)
                //from the resulting tree, but we set the left and right side to the result as
                //well just to get rid of null pointers running around.
                result = this.left_side = this.right_side = new TreeBranch().random_tree({
                    ignored_categories: [],
                    xy_data: xy_data_sorted.slice(0, length),
                    num_levels: num_levels - 1,
                    y_index: y_index,
                    categorical_categories: categorical_categories,
                });
            }
            else {
                //otherwise just grow a leaf.
                result = this.left_side = this.right_side = new TreeLeaf(
                //compute average of y_index of right hand side.
                xy_data_sorted.slice(0, length).map(function (row) { return row[y_index]; }).reduce(function (sum, current) { return sum + current; }, 0) / length);
            }
        }
        else {
            if (num_levels > 1) {
                if (first_of_right_hand > 1) {
                    this.left_side = new TreeBranch().random_tree({
                        ignored_categories: [],
                        xy_data: xy_data_sorted.slice(0, first_of_right_hand),
                        num_levels: num_levels - 1,
                        y_index: y_index,
                        categorical_categories: categorical_categories,
                    });
                }
                else {
                    this.left_side = new TreeLeaf(
                    //compute average of y_index of left hand side.
                    xy_data_sorted.slice(0, first_of_right_hand).map(function (row) { return row[y_index]; }).reduce(function (sum, current) { return sum + current; }, 0) / length);
                }
                if (length - first_of_right_hand > 1) {
                    this.right_side = new TreeBranch().random_tree({
                        ignored_categories: [],
                        xy_data: xy_data_sorted.slice(first_of_right_hand, length),
                        num_levels: num_levels - 1,
                        y_index: y_index,
                        categorical_categories: categorical_categories,
                    });
                }
                else {
                    this.right_side = new TreeLeaf(
                    //compute average of y_index of right hand side.
                    xy_data_sorted.slice(first_of_right_hand, length).map(function (row) { return row[y_index]; }).reduce(function (sum, current) { return sum + current; }, 0) / length);
                }
            }
            else {
                this.left_side = new TreeLeaf(
                //compute average of y_index of left hand side.
                xy_data_sorted.slice(0, first_of_right_hand).map(function (row) { return row[y_index]; }).reduce(function (sum, current) { return sum + current; }, 0) / length);
                this.right_side = new TreeLeaf(
                //compute average of y_index of right hand side.
                xy_data_sorted.slice(first_of_right_hand, length).map(function (row) { return row[y_index]; }).reduce(function (sum, current) { return sum + current; }, 0) / length);
            }
        }
        return result;
    };
    return TreeBranch;
}(BranchOrLeaf));
exports.TreeBranch = TreeBranch;
var JLBoost = /** @class */ (function () {
    function JLBoost(_a) {
        var _b = _a.learning_rate, learning_rate = _b === void 0 ? 0.07 : _b, _c = _a.categorical_catagories, categorical_catagories = _c === void 0 ? [] : _c;
        this.trees = [];
        this.learning_rate = learning_rate;
        this.categorical_categories = categorical_catagories;
    }
    JLBoost.prototype.predict = function (xy_data) {
        var _this = this;
        var output = Array(xy_data.length).fill(0);
        var _loop_1 = function (tree) {
            var treePrediction = tree.predict(xy_data, this_1.categorical_categories);
            output = output.map(function (value, index) {
                return value + treePrediction[index] * _this.learning_rate;
            });
        };
        var this_1 = this;
        for (var _i = 0, _a = this.trees; _i < _a.length; _i++) {
            var tree = _a[_i];
            _loop_1(tree);
        }
        return output;
    };
    JLBoost.prototype.predict_single = function (data) {
        var output = 0;
        for (var _i = 0, _a = this.trees; _i < _a.length; _i++) {
            var tree = _a[_i];
            var treePrediction = tree.predict_single(data, this.categorical_categories);
            output += treePrediction;
        }
        return output * this.learning_rate;
    };
    JLBoost.prototype.train = function (_a) {
        var _this = this;
        var xy_data = _a.xy_data, _b = _a.y_index, y_index = _b === void 0 ? 'y' : _b, _c = _a.n_steps, n_steps = _c === void 0 ? 1000 : _c, _d = _a.tree_depth, tree_depth = _d === void 0 ? 2 : _d, _e = _a.talk, talk = _e === void 0 ? true : _e;
        var current_output = this.predict(xy_data);
        //Drop all features which don't do anything.
        var featuresToDrop = [];
        var _loop_2 = function (feature) {
            //see if this is a categorical feature or a numerical feature.
            if (this_2.categorical_categories.includes(feature)) {
                var features_found = [];
                for (var _g = 0, xy_data_1 = xy_data; _g < xy_data_1.length; _g++) {
                    var value = xy_data_1[_g];
                    if (!features_found.includes(value[feature])) {
                        features_found.push(value[feature]);
                    }
                    if (features_found.length > 1)
                        break;
                }
                if (features_found.length < 2) {
                    featuresToDrop.push(feature);
                    if (talk) {
                        console.log("Dropping constant categorical feature ".concat(feature));
                    }
                }
            }
            else {
                var max_value = xy_data.reduce(function (max, current) {
                    return current[feature] > max ? current[feature] : max;
                }, Number.MIN_SAFE_INTEGER);
                var min_value = xy_data.reduce(function (min, current) {
                    return current[feature] < min ? current[feature] : min;
                }, Number.MAX_SAFE_INTEGER);
                if (max_value == min_value) {
                    featuresToDrop.push(feature);
                    if (talk) {
                        console.log("Dropping constant feature ".concat(feature));
                    }
                }
            }
        };
        var this_2 = this;
        for (var _i = 0, _f = Object.keys(xy_data[0]); _i < _f.length; _i++) {
            var feature = _f[_i];
            _loop_2(feature);
        }
        xy_data = xy_data.map(function (row) { return Object.fromEntries(Object.entries(row).filter(function (_a) {
            var feature = _a[0], value = _a[1];
            return !featuresToDrop.includes(feature);
        })); });
        var ignored_categories = [];
        var last_loss = null;
        var _loop_3 = function (n) {
            var adjusted_data = xy_data.map(function (row, row_n) {
                var _a;
                return __assign(__assign({}, row), (_a = {}, _a[y_index] = row[y_index] - current_output[row_n], _a));
            });
            var new_tree = new TreeBranch();
            new_tree.random_tree({
                num_levels: tree_depth,
                ignored_categories: ignored_categories,
                xy_data: adjusted_data,
                y_index: y_index,
                categorical_categories: this_3.categorical_categories,
            });
            var new_tree_output = new_tree.predict(xy_data, this_3.categorical_categories);
            var new_output = current_output.map(function (value, index) {
                return value + new_tree_output[index] * _this.learning_rate;
            });
            //const new_loss = Math.stdDev(xy_data[y_index] - new_output);
            var error = xy_data.map(function (row, row_n) { return new_output[row_n] - row[y_index]; });
            var error_sum = error.reduce(function (sum, current) { return sum + current; }, 0);
            var error_mean = error_sum / error.length;
            var error_dist_squared = error.map(function (value) { return (value - error_mean) * (value - error_mean); }).reduce(function (sum, current) { return sum + current; }, 0);
            var new_loss = Math.sqrt(error_dist_squared / error.length);
            ignored_categories = [new_tree.feature_index];
            if (last_loss === null || new_loss < last_loss) {
                this_3.trees.push(new_tree);
                last_loss = new_loss;
                current_output = new_output;
                if (talk) {
                    console.log("Step ".concat(n, ": Output  ").concat(new_loss, "  split on ").concat(new_tree.feature_index, " at ").concat(new_tree.split_value));
                }
            }
            else {
                if (talk) {
                    console.log("Step ".concat(n, ": Output [").concat(new_loss, "] split on ").concat(new_tree.feature_index, " at ").concat(new_tree.split_value, " --rejected"));
                }
            }
        };
        var this_3 = this;
        for (var n = 0; n < n_steps; n++) {
            _loop_3(n);
        }
        return this;
    };
    return JLBoost;
}());
exports.JLBoost = JLBoost;
//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
// if (require.main === module) {
//     //seed random for the test.
//     Math.random = mulberry32(0);
//     for( let i = 0; i < 5; ++i ){
//         console.log(Math.random());
//     }
//     //Do some tests of the module
//     const test_data = [
//         { 'gender':'m', 'age':2,  'y':0 },
//         { 'gender':'f', 'age':3,  'y':0 },
//         { 'gender':'m', 'age':6,  'y':0 },
//         { 'gender':'f', 'age':7,  'y':0 },
//         { 'gender':'f', 'age':9,  'y':0 },
//         { 'gender':'m', 'age':12, 'y':.1 },
//         { 'gender':'m', 'age':15, 'y':.3 },
//         { 'gender':'f', 'age':16, 'y':9 },
//         { 'gender':'m', 'age':16, 'y':1 },
//         { 'gender':'m', 'age':18, 'y':10 },
//         { 'gender':'f', 'age':18, 'y':8 },
//         { 'gender':'m', 'age':20, 'y':7 },
//         { 'gender':'m', 'age':21, 'y':7 },
//         { 'gender':'m', 'age':23, 'y':7 },
//         { 'gender':'f', 'age':26, 'y':4 },
//         { 'gender':'m', 'age':27, 'y':4 },
//         { 'gender':'f', 'age':29, 'y':2 },
//         { 'gender':'f', 'age':30, 'y':1 },
//         { 'gender':'m', 'age':40, 'y':1 },
//         { 'gender':'m', 'age':100, 'y':10 },
//         { 'gender':'f', 'age':100, 'y':9 },
//     ];
//     const model = new JLBoost( {categorical_catagories:['gender'] });
//     // const test_data = [
//     //     { 'gender':0, 'age':2,  'y':0 },
//     //     { 'gender':1, 'age':3,  'y':0 },
//     //     { 'gender':0, 'age':6,  'y':0 },
//     //     { 'gender':1, 'age':7,  'y':0 },
//     //     { 'gender':1, 'age':9,  'y':0 },
//     //     { 'gender':0, 'age':12, 'y':.1 },
//     //     { 'gender':0, 'age':15, 'y':.3 },
//     //     { 'gender':1, 'age':16, 'y':9 },
//     //     { 'gender':0, 'age':16, 'y':1 },
//     //     { 'gender':0, 'age':18, 'y':10 },
//     //     { 'gender':1, 'age':18, 'y':8 },
//     //     { 'gender':0, 'age':20, 'y':7 },
//     //     { 'gender':0, 'age':21, 'y':7 },
//     //     { 'gender':0, 'age':23, 'y':7 },
//     //     { 'gender':1, 'age':26, 'y':4 },
//     //     { 'gender':0, 'age':27, 'y':4 },
//     //     { 'gender':1, 'age':29, 'y':2 },
//     //     { 'gender':1, 'age':30, 'y':1 },
//     //     { 'gender':0, 'age':40, 'y':1 },
//     //     { 'gender':0, 'age':100, 'y':10 },
//     //     { 'gender':1, 'age':100, 'y':9 },
//     // ];
//     // const model = new JLBoost( {});
//     model.train( {xy_data: test_data, y_index:'y', n_steps:1000, tree_depth:7, talk:true })
//     const model_results = model.predict( test_data );
//     const with_prediction = test_data.map( (row,row_n) => {
//         return {
//             ...row,
//             prediction: model_results[row_n],
//             diff: model_results[row_n]-row['y']
//         }
//     });
//     console.table( with_prediction );
//     //print first tree to screen.
//     const first_tree_as_dict = model.trees[0].to_dict();
//     console.log(JSON.stringify(first_tree_as_dict, null,2));
// }
//# sourceMappingURL=JLBoost.js.map