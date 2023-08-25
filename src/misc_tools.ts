

export interface JsonDict {
    [key: string]: any;
}

/**
 * Generates a dictionary of lists from an array of objects.
 *
 * @param {Object[]} list - The list of objects.
 * @return {Object} The dictionary of lists.
 */
export function listToDictOfLists(list: { [key: string]: number | string }[]): { [key: string]: (number | string)[] } {
    const dict: { [key: string]: (number | string)[] } = {};

    for (const item of list) {
        for (const key in item) {
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



/**
 * Shuffles the elements in an array.
 * Durstenfeld shuffle
 * https://stackoverflow.com/a/12646864/1419054
 *
 * @param {Array} array - The array to be shuffled.
 * @return {Array} The shuffled array.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}