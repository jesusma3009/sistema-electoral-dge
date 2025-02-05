<?php

class AdminApiController
{
    protected $twig;
    protected $db;

    public function __construct($twig)
    {
        $this->twig = $twig;
        $this->db = new VotingDB();
    }

    private function sendResponse($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    private function sendError($message, $statusCode = 400)
    {
        $this->sendResponse(['error' => $message], $statusCode);
    }

    private function checkAuth()
    {
        if (!isset($_SESSION['admin']) || $_SESSION['admin'] !== true) {
            $this->sendError("No autorizado", 403);
        }
    }

    public function loginApi()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->db->insertLog('Método no permitido', 'loginApi');
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (!isset($input['password'])) {
            $this->db->insertLog('Contraseña no introducida', 'loginApi');
            $this->sendError("Contraseña no proporcionada");
        }

        if ($input['password'] === $_ENV['MASTER_PASSWORD']) {
            $_SESSION['admin'] = true;
            $this->db->insertLog('Acceso concedido a administración', 'loginApi');
            $this->sendResponse(['success' => true]);
        } else {
            $this->db->insertLog('Contraseña incorrecta', 'loginApi');
            $this->sendError("Contraseña incorrecta", 403);
        }
    }

    public function crearVotacion()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $tipo = $input['tipo'] ?? "simple";

        if (empty($input['clave_publica'])) {
            $this->sendError("La clave pública no ha sido proporcionada");
        }

        $clave_publica = json_encode($input['clave_publica']);
        $nombre = "Nueva votación";
        $descripcion = "";
        $fecha_inicio = null;
        $fecha_fin = null;
        $votoNulo = 1;
        $votoBlanco = 1;

        $votacion_id = $this->db->createVotacion($nombre, $descripcion, $tipo, $clave_publica, $fecha_inicio, $fecha_fin, $votoNulo, $votoBlanco);

        if ($votacion_id) {
            $_SESSION['votacion_id'] = $votacion_id;
            $this->sendResponse(['success' => true, 'votacion_id' => $votacion_id]);
        } else {
            $this->sendError("Error al crear la votación");
        }
    }

    public function guardarConfiguracion()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['votacion_id'])) {
            $this->sendError("Votación no identificada");
        }

        $votacion_id = $input['votacion_id'];
        $votoNulo = !empty($input['votoNulo']) ? 1 : 0;
        $votoBlanco = !empty($input['votoBlanco']) ? 1 : 0;
        $fecha_inicio = $input['fecha_inicio'] ?? null;
        $fecha_fin = $input['fecha_fin'] ?? null;

        $votacion = $this->db->getVotacionById($votacion_id);
        if (!$votacion) {
            $this->sendError("Votación no encontrada");
        }

        $result = $this->db->updateVotacion($votacion_id, $votacion['nombre'], $votacion['descripcion'], $fecha_inicio, $fecha_fin, $votoNulo, $votoBlanco);

        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Configuración actualizada']);
        } else {
            $this->sendError("Error al actualizar configuración");
        }
    }

    public function editarDetalles()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['votacion_id']) || empty($input['nombre']) || empty($input['descripcion'])) {
            $this->sendError("Parámetros insuficientes");
        }

        $votacion_id = $input['votacion_id'];
        $nombre = trim($input['nombre']);
        $descripcion = trim($input['descripcion']);

        $votacion = $this->db->getVotacionById($votacion_id);
        if (!$votacion) {
            $this->sendError("Votación no encontrada");
        }

        $result = $this->db->updateVotacion($votacion_id, $nombre, $descripcion, $votacion['fecha_inicio'], $votacion['fecha_fin'], $votacion['votoNulo'], $votacion['votoBlanco']);

        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Detalles actualizados']);
        } else {
            $this->sendError("Error al actualizar detalles de la votación");
        }
    }

    public function agregarCandidato()
    {
        $this->checkAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['votacion_id']) || empty($input['nombre'])) {
            $this->sendError("Parámetros insuficientes");
        }
        $votacion_id = $input['votacion_id'];
        $nombre = trim($input['nombre']);
        $candidatos = $this->db->getCandidatosByVotacion($votacion_id);
        $orden = count($candidatos) + 1;
        $candidato_id = $this->db->addCandidato($votacion_id, $nombre, $orden);

        if ($candidato_id) {
            $this->sendResponse(['success' => true, 'candidato_id' => $candidato_id]);
        } else {
            $this->sendError("Error al agregar candidato");
        }
    }

    public function editarCandidato($id)
    {
        $this->checkAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['nombre'])) {
            $this->sendError("El nombre del candidato es obligatorio");
        }
        $nombre = trim($input['nombre']);
        $orden = isset($input['orden']) ? (int) $input['orden'] : 0;
        $result = $this->db->updateCandidato($id, $nombre, $orden);
        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Candidato actualizado correctamente']);
        } else {
            $this->sendError("Error al actualizar candidato");
        }
    }

    public function eliminarCandidato($id)
    {
        $this->checkAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }
        $result = $this->db->deleteCandidato($id);
        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Candidato eliminado correctamente']);
        } else {
            $this->sendError("Error al eliminar candidato");
        }
    }

}
?>