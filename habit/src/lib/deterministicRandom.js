export const seededUnit = (seed) => {
  const value = Math.sin(seed * 9973) * 10000;
  return value - Math.floor(value);
};

export const seededRange = (seed, min, max) => min + seededUnit(seed) * (max - min);
