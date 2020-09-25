var mongoose    = require('mongoose');

var PlayerSchema = new mongoose.Schema({
	name: {type: String, unique: true},
	points: {type: Number, default: 0}
});

module.exports = mongoose.model("Player", PlayerSchema);
