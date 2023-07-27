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
