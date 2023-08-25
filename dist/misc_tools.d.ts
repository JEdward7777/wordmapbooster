export interface JsonDict {
    [key: string]: any;
}
/**
 * Generates a dictionary of lists from an array of objects.
 *
 * @param {Object[]} list - The list of objects.
 * @return {Object} The dictionary of lists.
 */
export declare function listToDictOfLists(list: {
    [key: string]: number | string;
}[]): {
    [key: string]: (number | string)[];
};
/**
 * Shuffles the elements in an array.
 * Durstenfeld shuffle
 * https://stackoverflow.com/a/12646864/1419054
 *
 * @param {Array} array - The array to be shuffled.
 * @return {Array} The shuffled array.
 */
export declare function shuffleArray(array: any): void;
