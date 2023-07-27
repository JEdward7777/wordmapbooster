"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listToDictOfLists = void 0;
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
//# sourceMappingURL=misc_tools.js.map