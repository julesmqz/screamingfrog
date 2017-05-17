CREATE TABLE `yt_job` (
  `cpid` varchar(50) NOT NULL,
  `url` varchar(255) NOT NULL,
  `shop` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `delay` int(11) NOT NULL,
  `concurrency` int(11) NOT NULL,
  `finished` tinyint(1) DEFAULT 0 NOT NULL,
  PRIMARY KEY (`cpid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `yt_response` (
  `cpid` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) NOT NULL,
  `status` int(11) NOT NULL,
  `body` longtext,
  `jobId` varchar(50) NOT NULL,
  `finished` tinyint(1) DEFAULT 0 NOT NULL,
  PRIMARY KEY (`cpid`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;