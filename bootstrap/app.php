<?php
require_once __DIR__ . '/loadEnv.php';

require_once __DIR__ . '/../config/database.php';

session_start([
    'name' => 'VotacionDGE_UGR',
    'cookie_lifetime' => 604800,
    'cookie_secure' => true,
    'cookie_httponly' => !$_ENV['APP_DEBUG'],
    'cookie_samesite' => 'Strict'
]);