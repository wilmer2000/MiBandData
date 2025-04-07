export const camelToSnake = (str) => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
};


export const sanitizeIdentifier = (identifier) => {
  // Remove special characters and spaces, convert to lowercase
  return identifier
    .trim()
    .replace(/^(\d{8}_\d+_MiFitness_)/, '');
};
