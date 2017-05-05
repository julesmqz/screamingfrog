#!/usr/bin/env node

var amqp = require('amqplib/callback_api');
var SitemapCrawler = require('../Classes/SitemapCrawler.js');

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        var q = 'sitemap-crawl';

        ch.assertQueue(q, {durable: false});
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
        ch.consume(q, function(msg) {
            console.log(" [x] Received %s", msg.content.toString());
            var data = JSON.parse(msg.content.toString());
            var crawler = new SitemapCrawler();

            crawler.getSitemap(data.sitemapUrl);

        }, {noAck: true});
    });
});