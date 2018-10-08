let cf = require("leo-aws/utils/cloudformation.js")();

module.exports = cf.add(cf.dynamodb.table("LeoStream", {
	event: 'S',
	end: 'S',
	autoscale: true,
	throughput: {
		read: 20,
		write: 20
	}
})).add(cf.dynamodb.table("LeoArchive", {
	event: 'S',
	end: 'S',
	autoscale: true,
	throughput: {
		read: 5,
		write: 5
	}
})).add(cf.dynamodb.table("LeoEvent", {
	event: 'S',
	autoscale: true,
	throughput: {
		read: 5,
		write: 5
	},
	stream: "NEW_AND_OLD_IMAGES"
})).add(cf.dynamodb.table("LeoSettings", {
	id: 'S',
	autoscale: true,
	throughput: {
		read: 5,
		write: 5
	}
})).add(cf.dynamodb.table("LeoCron", {
	id: 'S',
	autoscale: true,
	throughput: {
		read: 20,
		write: 20
	},
	stream: "NEW_AND_OLD_IMAGES"
})).add(cf.dynamodb.table("LeoSystem", {
	id: 'S',
	autoscale: true,
	throughput: {
		read: 5,
		write: 5
	}
}));
