/*var googleDbConn = {
	host: '127.0.0.1',
	user: 'root',
	pass: 'Cybertuer2017',
	port: 3306
}*/

var config = {
	shops: [{
		name: 'Cochemania',
		url: 'https://www.cochemania.mx',
		sitemap: '/export/google/testSitemap.xml',
		database: {
			host: '127.0.0.1',
			user: 'cochem_shop',
			password: 'cochem_shop',
			port: 3306,
			database: 'cochem_shop'
		},
		queries:{
			oxseo:'SELECT CONCAT(\'https://www.cochemania.mx/\',oxseourl) as url FROM oxseo WHERE oxtype=\'static\'',
			cpwsearchexorbyteredirects: '',
		}
	}],
	database: {
		host: '127.0.0.1',
		user: 'root',
		password: '',
		database: 'yellingturtle'
	},
	rabbitmq: {
		url: 'amqp://localhost',
		queues: {
			simple: 'simple-crawl',
			replySimple: 'reply-simple-crawl',
			sitemap: 'sitemap-crawl',
			db: 'db-crawl',
			crawl: 'simple-crawl',
		}
	},
	server:{
		port: 9090
	}
};


try {
	var customConf = require('./config.custom.js');
	// do stuff
	extend(config, customConf);
} catch (ex) {
	// File does not exists
}


module.exports = config;