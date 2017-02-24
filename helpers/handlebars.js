/* Custom helpers */
function hbsHelpers(hbs) {
  return hbs.create({
    helpers: {
        reverse: (arr) => {
            arr.reverse();
        },
        inc: (val) => {
        	return parseInt(val) + 1;
        }
    }
  });
}

module.exports = hbsHelpers;