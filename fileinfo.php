<?php

set_time_limit(300);
ob_implicit_flush(true);
header('Content-Type: application/json');

require 'class/fileinfo.class.php';

if (verify($_POST['id']) && verify($_POST['url']) && verify($_POST['duration']) && verify($_POST['uid'])) {
	$data = array(
		'id' => (int) $_POST['id'],
		'url' => (string) $_POST['url'],
		'duration' => (int) $_POST['duration'],
		'uid' => (int) $_POST['uid'],
	);
	try {
		$DBH = new PDO('mysql:host=famed.mysql.ukraine.com.ua;dbname=famed_sloth', 'famed_sloth', '6kgwqg54', array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		$fileinfo = new FileInfo($DBH);
		echo $fileinfo->execute($data);
		$DBH = null;
	} catch (PDOException $e) {
		$fileinfo = new FileInfo();
		echo $fileinfo->send($fileinfo->kbps($data['url'], $data['duration']));
	}
}

?>