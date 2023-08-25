"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleArray = exports.listToDictOfLists = void 0;
/**
 * Generates a dictionary of lists from an array of objects.
 *
 * @param {Object[]} list - The list of objects.
 * @return {Object} The dictionary of lists.
 */
function listToDictOfLists(list) {
    var dict = {};
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var item = list_1[_i];
        for (var key in item) {
            if (key in item) {
                if (!(key in dict)) {
                    dict[key] = [];
                }
                dict[key].push(item[key]);
            }
        }
    }
    return dict;
}
exports.listToDictOfLists = listToDictOfLists;
/**
 * Shuffles the elements in an array.
 * Durstenfeld shuffle
 * https://stackoverflow.com/a/12646864/1419054
 *
 * @param {Array} array - The array to be shuffled.
 * @return {Array} The shuffled array.
 */
function shuffleArray(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
    }
}
exports.shuffleArray = shuffleArray;
//# sourceMappingURL=misc_tools.js.map