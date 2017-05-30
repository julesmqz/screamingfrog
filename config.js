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
		queries: {
			oxseo: 'SELECT CONCAT(\'https://www.cochemania.mx/\',oxseourl) as url FROM oxseo WHERE oxtype=\'static\'',
			cpwsearchexorbyteredirects: ''
		}
	}, {
		name: 'Cyberpuerta',
		url: 'https://www.cyberpuerta.mx',
		altUrls: ['http://web01.cyberpuerta.mx/~cyberp', 'http://web02.cyberpuerta.mx/~cyberp'],
		sitemap: '/emsitemap/sitemap-mx.xml',
		database: {
			host: '127.0.0.1',
			user: 'root',
			password: '',
			port: 3306,
			database: 'cyberp_shop2'
		},
		queries: {
			oxseo: 'SELECT CONCAT(\'https://www.cyberpuerta.mx/\',oxseourl) as url FROM oxseo WHERE oxtype in (\'static\',\'dynamic\') AND oxseourl != \'\'',
			redirects: 'SELECT link as url FROM cpwsearchexorbyteredirects WHERE active',
			specialLinks: 'SELECT href as url FROM emoxcategory_SpecialListLinks WHERE active'
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
			specific: 'specific-crawl'
		}
	},
	server: {
		port: 9090,
		path: '/Users/jules/Workspace/yellingturtle',
		requestTimeout: 50000
	},
	mail: {
		sender: 'info@cyberpuerta.mx',
		recipients: ['j.marquez@cyberpuerta.mx'],
		sesCreds: {
			'key': '',
			'secret': '',
			'region': ''
		}
	}
};


try {
	var customConf = require('./config.custom.js');
	// do stuff
	config = customConf;
} catch (ex) {
	// File does not exists
}


module.exports = config;