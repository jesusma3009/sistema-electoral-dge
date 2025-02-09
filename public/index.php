<?php
require_once __DIR__ . '/../bootstrap/app.php';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$prefix = parse_url($_ENV['DOMAIN'], PHP_URL_PATH);
$uri = str_replace($prefix, '', $uri);
$uri = rtrim($uri, '/') ?: '/';

switch ($uri) {
    case '/':
        require_once __DIR__ . '/../controllers/admin/admin.php';
        (new AdminController($container['twig']))->login();
        break;
    case '/admin':
        require_once __DIR__ . '/../controllers/admin/admin.php';
        (new AdminController($container['twig']))->dashboard();
        break;
    case '/admin/votacion/nueva':
        require_once __DIR__ . '/../controllers/admin/admin.php';
        (new AdminController($container['twig']))->nuevaVotacion();
        break;
    case '/admin/votacion/nueva/simple':
        require_once __DIR__ . '/../controllers/admin/admin.php';
        (new AdminController($container['twig']))->nuevaVotacionSimple();
        break;
    // RUTAS PARA LAS LLAMADAS API:
    case '/admin/login':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->loginApi();
        break;
    case '/admin/votacion/crear':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->crearVotacion();
        break;
    case '/admin/votacion/configuracion/guardar':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->guardarConfiguracion();
        break;
    case '/admin/votacion/editar/detalles':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->editarDetalles();
        break;
    case '/admin/votacion/censo/agregar':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->agregarVotante();
        break;
    case '/admin/votacion/censo/editar':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->editarVotante();
        break;
    case '/admin/votacion/censo/eliminar':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->eliminarVotante();
        break;
    case '/admin/votacion/censo/import':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->importarCenso();
        break;
    case '/admin/votacion/candidatos/agregar':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->agregarCandidato();
        break;
    case '/admin/votacion/vista-previa/datos':
        require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
        (new AdminApiController($container['twig']))->datosVistaPrevia();
        break;
    default:
        if (preg_match('#^/admin/votacion/candidatos/editar/(.+)$#', $uri, $matches)) {
            require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
            (new AdminApiController($container['twig']))->editarCandidato($matches[1]);
            break;
        }
        if (preg_match('#^/admin/votacion/candidatos/eliminar/(.+)$#', $uri, $matches)) {
            require_once __DIR__ . '/../controllers/admin/AdminApiController.php';
            (new AdminApiController($container['twig']))->eliminarCandidato($matches[1]);
            break;
        }
        if (preg_match('#^/admin/(\d+)/panel$#', $uri, $matches)) {
            require_once __DIR__ . '/../controllers/admin/admin.php';
            (new AdminController($container['twig']))->panelVotacion($matches[1]);
            break;
        }
        http_response_code(404);
        echo $twig->render('404.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN']
        ]);
        break;
}
?>