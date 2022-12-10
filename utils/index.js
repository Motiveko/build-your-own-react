const toPascal = (text) => (text.replace(/([A-Z])/g, "-$1")).toLowerCase();

export {toPascal}