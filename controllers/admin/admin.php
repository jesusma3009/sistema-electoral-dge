<?php

class AdminController
{
    protected $twig;

    public function __construct($twig)
    {
        $this->twig = $twig;
    }

    private function checkAuth()
    {
        if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
            $db = new VotingDB();
            $db->insertLog('Intento de acceso no autorizado al panel de administración', "ADMIN_PAGE");
            header('Location: ' . $_ENV['DOMAIN']);
            exit;
        }
    }

    public function index()
    {
        $this->login();
    }

    public function login()
    {
        if (isset($_SESSION['admin']) && $_SESSION['admin'] === true) {
            header('Location: ' . $_ENV['DOMAIN'] . '/admin');
            exit;
        }
        echo $this->twig->render('admin/login.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN'],
        ]);
    }

    public function dashboard()
    {
        $this->checkAuth();
        $db = new VotingDB();
        $votaciones = $db->getAllVotaciones();
        echo $this->twig->render('admin/dashboard.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN'],
            'votaciones' => $votaciones
        ]);
    }

    public function nuevaVotacion()
    {
        $this->checkAuth();
        echo $this->twig->render('admin/nuevaVotacion.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN'],
        ]);
    }

    public function nuevaVotacionSimple()
    {
        $this->checkAuth();
        echo $this->twig->render('admin/nuevaVotacionSimple.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN'],
        ]);
    }

    public function panelVotacion($votacionId)
    {
        $this->checkAuth();
        $db = new VotingDB();

        // Obtener la votación según el id
        $votacion = $db->getVotacionById($votacionId);
        if (!$votacion) {
            http_response_code(404);
            echo $this->twig->render('404.twig', [
                'sesion' => $_SESSION,
                'domain' => $_ENV['DOMAIN'],
                'error' => 'Votación no encontrada'
            ]);
            exit;
        }

        // Obtener los candidatos y el censo para esa votación
        $candidatos = $db->getCandidatosByVotacion($votacionId);
        $censo = $db->getCensoByVotacion($votacionId);

        // Renderizar la vista pasando los datos obtenidos
        echo $this->twig->render('admin/panelVotacion.twig', [
            'sesion' => $_SESSION,
            'domain' => $_ENV['DOMAIN'],
            'votacion' => $votacion,
            'candidatos' => $candidatos,
            'censo' => $censo,
        ]);
    }
}
?>
