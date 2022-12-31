const database = require('./database');
const initial = require('./initial');
const seeder = require('./seeder');
const clean = require('./clean');

const arguments = process.argv.slice(2).map(function (argValue) {
  return argValue;
});

switch (arguments[0]) {
  case "initial":
    (async () => await initial(database))();
    break;

  case "seed":
    (async () => await seeder(database))();
    break;

  case "clean":
    (async () => await clean(database))();
    break;

  default:
    console.log("\x1b[33m", `Migration command argument not found!`);
    break;
}

module.exports = {
  initial,
  seeder,
  clean
};
