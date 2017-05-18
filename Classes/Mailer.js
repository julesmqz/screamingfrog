var config = require('../config.js');
var mysql = require('mysql');
var nodemailer = require('nodemailer');
var aws = require('aws-sdk');
var fs = require('fs');


function Mailer() {
	this.setDefaults();
	this.Auth();
}


Mailer.prototype.setDefaults = function() {
	var self = this;
	self.from = config.mail.sender;
	self.recipients = config.mail.recipients;
	self.creds = config.mail.sesCreds;
	self.attachments = [];
}

Mailer.prototype.Auth = function() {
	var self = this;
	aws.config.set('accessKeyId', self.creds.key);
	aws.config.set('secretAccessKey', self.creds.secret);
	aws.config.set('region', self.creds.region);

	self.transporter = nodemailer.createTransport({
		SES: new aws.SES({
			apiVersion: '2010-12-01'
		})
	});
};

Mailer.prototype.send = function(subject, message, cb) {
	var self = this;
	var mail = {
		from: self.from,
		to: self.recipients,
		subject: subject,
		text: message
	};

	if (self.attachments.length > 0) {
		mail.attachments = self.attachments;
	}

	self.transporter.sendMail(mail, function(err, info) {
		//console.log(err, info);
		cb.apply(null, [err, info]);
	});
};

Mailer.prototype.setAttachment = function(name, contents, readFromPath) {
	readFromPath = readFromPath || false;
	var self = this;
	if (readFromPath) {
		self.attachments.push({
			filename: name,
			content: fs.createReadStream(contents)
		});
	} else {
		self.attachments.push({
			filename: name,
			content: contents
		});
	}

}

Mailer.prototype.set = function(option, value) {
	var self = this;
}


module.exports = Mailer;