<?php
require_once __DIR__ . '/loadEnv.php';

require_once __DIR__ . '/../config/database.php';

session_start([
    'cookie_lifetime' => 604800,
]);