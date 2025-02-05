<?php
require_once __DIR__ . '/../vendor/autoload.php';
$container = [];
use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

use Twig\Loader\FilesystemLoader;
use Twig\Environment;

// Configuración de Twig
$loader = new FilesystemLoader(__DIR__ . '/../resources/views');
$twig = new Environment($loader, [
    'debug' => $_ENV['APP_DEBUG'],
]);

// Haciendo Twig accesible en todo el proyecto
$container['twig'] = $twig;
