/* Custom helpers */
function hbsHelpers(hbs) {
  return hbs.create({
    helpers: {
        reverse: (arr) => {
            arr.reverse();
        }
    }
  });
}

module.exports = hbsHelpers;