function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function calculateSquare(matrix, chunkSize, randomFactor) {
  let sumComponents = 0;
  let sum = 0;
  for (let i = 0; i < matrix.length - 1; i += chunkSize) {
    for (let j = 0; j < matrix.length - 1; j += chunkSize) {
      const BOTTOM_RIGHT = matrix[j + chunkSize]
        ? matrix[j + chunkSize][i + chunkSize]
        : null;
      const BOTTOM_LEFT = matrix[j + chunkSize]
        ? matrix[j + chunkSize][i]
        : null;
      const TOP_LEFT = matrix[j][i];
      const TOP_RIGHT = matrix[j][i + chunkSize];
      const { count, sum } = [
        BOTTOM_RIGHT,
        BOTTOM_LEFT,
        TOP_LEFT,
        TOP_RIGHT
      ].reduce(
        (result, value) => {
          if (isFinite(value) && value != null) {
            result.sum += value;
            result.count += 1;
          }
          return result;
        },
        { sum: 0, count: 0 }
      );
      matrix[j + chunkSize / 2][i + chunkSize / 2] =
        sum / count + randomInRange(-randomFactor, randomFactor);
    }
  }
}

function calculateDiamond(matrix, chunkSize, randomFactor) {
  const half = chunkSize / 2;
  for (let y = 0; y < matrix.length; y += half) {
    for (let x = (y + half) % chunkSize; x < matrix.length; x += chunkSize) {
      const BOTTOM = matrix[y + half] ? matrix[y + half][x] : null;
      const LEFT = matrix[y][x - half];
      const TOP = matrix[y - half] ? matrix[y - half][x] : null;
      const RIGHT = matrix[y][x + half];
      const { count, sum } = [BOTTOM, LEFT, TOP, RIGHT].reduce(
        (result, value) => {
          if (isFinite(value) && value != null) {
            result.sum += value;
            result.count += 1;
          }
          return result;
        },
        { sum: 0, count: 0 }
      );
      matrix[y][x] = sum / count + randomInRange(-randomFactor, randomFactor);
    }
  }
  return matrix;
}

function diamondSquare(randomness = 10, n = 11) {
  const MATRIX_LENGTH = Math.pow(2, n) + 1;
  const CANVAS_HEIGHT = MATRIX_LENGTH * 2;
  const CANVAS_WIDTH = MATRIX_LENGTH * 2;
  const MATRIX_DIMENSIONS = {
    pixelHeight: CANVAS_HEIGHT / MATRIX_LENGTH,
    pixelWidth: CANVAS_WIDTH / MATRIX_LENGTH
  };
  const matrix = new Array(MATRIX_LENGTH)
    .fill(0)
    .map(() => new Array(MATRIX_LENGTH).fill(null));

  matrix[0][MATRIX_LENGTH - 1] = randomInRange(0, randomness);
  matrix[MATRIX_LENGTH - 1][0] = randomInRange(0, randomness);
  matrix[0][0] = randomInRange(0, randomness);
  matrix[MATRIX_LENGTH - 1][MATRIX_LENGTH - 1] = randomInRange(
    0,
    randomness
  );

  let chunkSize = MATRIX_LENGTH - 1;
  let randomFactor = randomness;

  while (chunkSize > 1) {
    calculateSquare(matrix, chunkSize, randomFactor);
    calculateDiamond(matrix, chunkSize, randomFactor);
    chunkSize /= 2;
    randomFactor /= 2;
  }

  const maxValue = matrix.reduce((max, row) => {
    return row.reduce((max, value) => Math.max(value, max));
  }, -Infinity);

  return matrix.map((row) => {
    return row.map((val) => val / maxValue);
  });
}

this.onmessage = (e) => {
  const { width, height, totalBlocks, blockSize, cx, cy, src } = e.data
  const rowWidth = Math.ceil(width / blockSize)
  const blocks = [...Array(totalBlocks)].map((_, i) => {
    const row = Math.floor(i / rowWidth)
    const column = i % rowWidth
    return [column, row]
  })
  const adjustedCx = Math.floor(width * cx)
  const adjustedCy = Math.floor(height * cy)
  const heights = diamondSquare(10, 11)
  const centerValue = heights[adjustedCy][adjustedCx]
  const sortedBlocks = blocks.sort(([columnA, rowA], [columnB, rowB]) => {
    const blockHeightA = heights[rowA][columnA]
    const blockHeightB = heights[rowB][columnB]
    const scoreA = Math.abs(blockHeightA - centerValue)
    const scoreB = Math.abs(blockHeightB - centerValue)
    return scoreB - scoreA
  })
  const blockBuffer = new Uint16Array(sortedBlocks.flat())
  postMessage({ blockBuffer, src })
}