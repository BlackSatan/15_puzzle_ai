const util = require('util')

function generateMap() {
  const arr = [
    ...Array(15).keys(),
    null,
  ].map(i => i !== null ? i + 1 : i);
  const shuffleArray = arr => (
    arr
      .map(a => [Math.random(), a])
      .sort((a, b) => a[0] - b[0])
      .map(a => a[1])
  );
  const perChunk = 4;
  return shuffleArray(arr).reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index/perChunk);

    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}

function generateValidMap() {
  let map;
  do {
    console.log('map gen');
    map = generateMap();
  } while (!get15PuzzleIsStateHasSolution(map));
  return map;
}

const initialState = generateValidMap();
console.log('initialState', util.inspect(initialState, {showHidden: false, depth: null}));

function get15PuzzleFlatState(state) {
  return state.reduce((list, el) => [ ...list, ...el ], []);
}

function taxiCabMetric(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function get15PuzzleHash(state) {
  const flatState = get15PuzzleFlatState(state);
  return flatState.join('|');
}

function find15PuzzleItemPosition(state, needed) {
  const neededRow = state.findIndex(row => row.some(item => item === needed));
  const neededCol = state[neededRow].findIndex(cell => cell === needed);
  return [neededRow, neededCol];
}

function get15PuzzleIsStateHasSolution(state) {
  const flatState = get15PuzzleFlatState(state);
  const nk = flatState
    .filter(item => item !== null)
    .map((item, index) => {
      return flatState
        .filter((filterItem, filterIndex) => filterIndex > index && filterItem < item && filterItem !== null)
        .length;
    })
    .reduce((a, b) => a + b, 0);
  const [nullRow] = find15PuzzleItemPosition(state, null);
  return (nk + nullRow + 1) % 2 === 0;
}

function make15PuzzleSteps(state) {
  const [freeRow, freeCol] = find15PuzzleItemPosition(state, null);
  const nextStates = [];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  for (const [rowDirection, colDirection] of directions) {
    const nextRow = freeRow + rowDirection;
    const nextCol = freeCol + colDirection;
    if (state[nextRow] && state[nextRow][nextCol]) {
      const mutatedState = state.map((row, rowIndex) => row.map((item, itemIndex) => {
        if (item === null) {
          return state[nextRow][nextCol];
        }
        if (rowIndex === nextRow && itemIndex === nextCol) {
          return null;
        }
        return item;
      }));
      const step = [
        [freeRow, freeCol],
        [nextRow, nextCol],
      ];
      nextStates.push({
        state: mutatedState,
        step,
      });
    }
  }
  return nextStates
    .filter(item => get15PuzzleIsStateHasSolution(item.state));
}

function is15PuzzleFinalState(state) {
  console.log('state', state);
  const flatState = get15PuzzleFlatState(state);
  if (flatState.pop() !== null) {
    return false;
  }
  let last = 0;
  for (const puzzle of flatState) {
    if (puzzle !== last + 1) {
      return false;
    }
    last = puzzle;
  }
  return true;
}

function get15PuzzleStatePlacesScore(state) {
  const scores = state.map((row, rowIndex) => row.map((item, index) => {
    const [row, col] = find15PuzzleItemPosition(
      state,
      rowIndex === 3 && index === 3 ? null : rowIndex * 4 + index + 1,
    );
    return taxiCabMetric({ x: col, y: row }, { x: index, y: rowIndex });
  }));
  return -get15PuzzleFlatState(scores).reduce((a, b) => a + b, 0);
}

function rbfs(open, close, hash, nextStatesMaker, finalChecker, scoreMaker) {
  while (open.length > 0) {
    const {state: openState, score: openScore, depth: openDepth } = open.shift();


    const isFinal = finalChecker(openState);
    if (isFinal) {
      return {
        state: hash(openState),
        steps: close,
      };
    }

    const nextStates = nextStatesMaker(openState);
    const nextStatesScores = nextStates
      .map(nextState => scoreMaker(nextState.state))
      .map((score, index) => ({
        score,
        index
      }))
      .sort((a, b) => b.score - a.score);

    console.log('===level score===', openScore);
    for (const nextStateScore of nextStatesScores) {
      const {state: nextState, step: nextStep} = nextStates[nextStateScore.index];

      if (close[hash(nextState)]) {
        continue;
      }

      open
        .push({
          depth: openDepth + 1,
          state: nextState,
          score: nextStateScore.score,
        });
      open = open.sort((a, b) => b.score - a.score);
      close[hash(nextState)] = { value: hash(openState), depth: openDepth + 1 };
    }
  }

  return null;
}

const result = rbfs([{ state: initialState, score: 0, depth: 0 }], { [get15PuzzleHash(initialState)]: null, }, get15PuzzleHash, make15PuzzleSteps, is15PuzzleFinalState, get15PuzzleStatePlacesScore);
console.log(result);
