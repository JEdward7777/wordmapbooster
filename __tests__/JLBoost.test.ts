import { JLBoost, TreeBranch, TreeLeaf } from "../src/JLBoost";

describe('JLBoost', () => {
  let jlBoost: JLBoost;

  beforeEach(() => {
    jlBoost = new JLBoost({});
  });

  test('predict should return the expected output', () => {

    const leaf1 = new TreeLeaf( .1 );
    const leaf2 = new TreeLeaf( .2 );
    const testTreeBranch1 = new TreeBranch();
    (testTreeBranch1 as any).left_side = leaf1;
    (testTreeBranch1 as any).right_side = leaf2;
    (testTreeBranch1 as any).feature_index = 'category1';
    (testTreeBranch1 as any).split_value = .5;

    const leaf3 = new TreeLeaf( .3 );
    const leaf4 = new TreeLeaf( .4 );
    const testTreeBranch2 = new TreeBranch();
    (testTreeBranch2 as any).left_side = leaf3;
    (testTreeBranch2 as any).right_side = leaf4;
    (testTreeBranch2 as any).feature_index = 'category2';
    (testTreeBranch2 as any).split_value = .7;
    
    jlBoost.trees = [
      testTreeBranch1,
      testTreeBranch2
    ];
    jlBoost.learning_rate = 0.1;
    jlBoost.categorical_categories = [ 'category2'];

    const xy_data = [
      {category1: .5, category2: .5},
      {category1: .6, category2: .4},
    ];

    const output = jlBoost.predict(xy_data);

    // Assert the expected output
    expect(output).toEqual( [0.05000000000000001, 0.06000000000000001] );
  });

  test('predict_single should return the expected output', () => {
    const leaf1 = new TreeLeaf( .1 );
    const leaf2 = new TreeLeaf( .2 );
    const testTreeBranch1 = new TreeBranch();
    (testTreeBranch1 as any).left_side = leaf1;
    (testTreeBranch1 as any).right_side = leaf2;
    (testTreeBranch1 as any).feature_index = 'category1';
    (testTreeBranch1 as any).split_value = .5;

    const leaf3 = new TreeLeaf( .3 );
    const leaf4 = new TreeLeaf( .4 );
    const testTreeBranch2 = new TreeBranch();
    (testTreeBranch2 as any).left_side = leaf3;
    (testTreeBranch2 as any).right_side = leaf4;
    (testTreeBranch2 as any).feature_index = 'category2';
    (testTreeBranch2 as any).split_value = .7;
    
    jlBoost.trees = [
      testTreeBranch1,
      testTreeBranch2
    ];
    jlBoost.learning_rate = 0.1;
    jlBoost.categorical_categories = [ 'category2'];

    const data = {
      category1: .5,
      category2: .4
    };

    const output = jlBoost.predict_single(data);

    // Assert the expected output
    expect(output).toEqual(0.05);
  });

  test('train should update the JLBoost instance correctly', () => {
    const xy_data = [
        { 'gender':'m', 'age':2,  'y':0 },
        { 'gender':'f', 'age':3,  'y':0 },
        { 'gender':'m', 'age':6,  'y':0 },
        { 'gender':'f', 'age':7,  'y':0 },
        { 'gender':'f', 'age':9,  'y':0 },
        { 'gender':'m', 'age':12, 'y':.1 },
        { 'gender':'m', 'age':15, 'y':.3 },
        { 'gender':'f', 'age':16, 'y':9 },
        { 'gender':'m', 'age':16, 'y':8 },
        { 'gender':'m', 'age':18, 'y':10 },
        { 'gender':'f', 'age':18, 'y':8 },
        { 'gender':'m', 'age':20, 'y':7 },
        { 'gender':'m', 'age':21, 'y':7 },
        { 'gender':'m', 'age':23, 'y':7 },
        { 'gender':'f', 'age':26, 'y':4 },
        { 'gender':'m', 'age':27, 'y':4 },
        { 'gender':'f', 'age':29, 'y':2 },
        { 'gender':'f', 'age':30, 'y':1 },
        { 'gender':'m', 'age':40, 'y':1 },
        { 'gender':'m', 'age':100, 'y':10 },
        { 'gender':'f', 'age':100, 'y':9 },
    ];

    jlBoost.categorical_categories = [ 'gender' ];

    const trainedJLBoost = jlBoost.train({
      xy_data,
      y_index: 'y',
      n_steps: 1000,
      tree_depth: 2,
      talk: false,
    });

    // Assert the updated JLBoost instance properties
    expect(trainedJLBoost.trees.length).toBeGreaterThan(50);
    expect(trainedJLBoost.learning_rate).toBe(.07);
    expect(trainedJLBoost.categorical_categories).toEqual([ 'gender' ]);


    expect( jlBoost.predict_single( { gender: 'm', age: 2 } ) ).toBeLessThan(2);
    expect( jlBoost.predict_single( { gender: 'm', age: 17 } ) ).toBeGreaterThan(5);
  });


  test('save and restore should function the same as before saving', () => {
    const xy_data = [
        { 'gender':'m', 'age':2,  'y':0 },
        { 'gender':'f', 'age':3,  'y':0 },
        { 'gender':'m', 'age':6,  'y':0 },
        { 'gender':'f', 'age':7,  'y':0 },
        { 'gender':'f', 'age':9,  'y':0 },
        { 'gender':'m', 'age':12, 'y':.1 },
        { 'gender':'m', 'age':15, 'y':.3 },
        { 'gender':'f', 'age':16, 'y':9 },
        { 'gender':'m', 'age':16, 'y':8 },
        { 'gender':'m', 'age':18, 'y':10 },
        { 'gender':'f', 'age':18, 'y':8 },
        { 'gender':'m', 'age':20, 'y':7 },
        { 'gender':'m', 'age':21, 'y':7 },
        { 'gender':'m', 'age':23, 'y':7 },
        { 'gender':'f', 'age':26, 'y':4 },
        { 'gender':'m', 'age':27, 'y':4 },
        { 'gender':'f', 'age':29, 'y':2 },
        { 'gender':'f', 'age':30, 'y':1 },
        { 'gender':'m', 'age':40, 'y':1 },
        { 'gender':'m', 'age':100, 'y':10 },
        { 'gender':'f', 'age':100, 'y':9 },
    ];

    jlBoost.categorical_categories = [ 'gender' ];

    jlBoost.train({
      xy_data,
      y_index: 'y',
      n_steps: 1000,
      tree_depth: 2,
      talk: false,
    });

    // Assert the updated JLBoost instance properties
    const treeLengthBefore = jlBoost.trees.length;
    const learningRateBefore = jlBoost.learning_rate;
    const categoricalCategoriesBefore = jlBoost.categorical_categories;
    const predict1Before = jlBoost.predict_single( { gender: 'm', age: 2 } );
    const predict2Before = jlBoost.predict_single( { gender: 'm', age: 17 } );


    const jlBoostSave = jlBoost.save();
    //Convert jlBoostSave to json and back.
    const jlBoostSaveJson = JSON.stringify(jlBoostSave);
    const jlBoostRestore = JSON.parse(jlBoostSaveJson);
    
    const restoredJLBoost = JLBoost.load(jlBoostRestore);
    const treeLengthAfter = restoredJLBoost.trees.length;
    const learningRateAfter = restoredJLBoost.learning_rate;
    const categoricalCategoriesAfter = restoredJLBoost.categorical_categories;
    const predict1After = restoredJLBoost.predict_single( { gender: 'm', age: 2 } );
    const predict2After = restoredJLBoost.predict_single( { gender: 'm', age: 17 } );

    expect(treeLengthAfter).toBe(treeLengthBefore);
    expect(learningRateAfter).toBe(learningRateBefore);
    expect(categoricalCategoriesAfter).toEqual(categoricalCategoriesBefore);
    expect(predict1After).toEqual(predict1Before);
    expect(predict2After).toEqual(predict2Before);
  });
});
