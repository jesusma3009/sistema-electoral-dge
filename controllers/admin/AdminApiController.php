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

    // Método para agregar un votante a la votación
    public function agregarVotante()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['votacion_id']) || empty($input['nombre']) || empty($input['apellidos']) || empty($input['email'])) {
            $this->sendError("Parámetros insuficientes");
        }

        $votacion_id = $input['votacion_id'];
        $nombre = trim($input['nombre']);
        $apellidos = trim($input['apellidos']);
        $email = trim($input['email']);

        // Buscar el votante por email
        $votante = $this->db->getVotanteByEmail($email);

        if ($votante) {
            // Si existe, actualizamos sus datos con la nueva información
            $this->db->updateVotante($votante['id'], $nombre, $apellidos, $email);
            $votante_id = $votante['id'];
        } else {
            // Si no existe, se crea un registro nuevo en la tabla votantes
            $votante_id = $this->db->addVotante($nombre, $apellidos, $email);

            if (!$votante_id) {
                $this->sendError("Error al agregar votante");
            }
        }

        // Se agrega la asociación en la tabla censo para la votación
        $censoAdded = $this->db->addCensoEntry($votacion_id, $votante_id);

        if ($censoAdded === false) {
            $this->sendError("El votante ya está agregado a la votación", 409);
        }

        $this->sendResponse(['success' => true, 'votante_id' => $votante_id]);
    }

    // Método para editar los datos de un votante (afecta a todas las votaciones)
    public function editarVotante()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['votante_id']) || empty($input['nombre']) || empty($input['apellidos']) || empty($input['email'])) {
            $this->sendError("Parámetros insuficientes");
        }

        $votante_id = $input['votante_id'];
        $nombre = trim($input['nombre']);
        $apellidos = trim($input['apellidos']);
        $email = trim($input['email']);

        $result = $this->db->updateVotante($votante_id, $nombre, $apellidos, $email);

        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Votante actualizado']);
        } else {
            $this->sendError("Error al actualizar votante");
        }
    }

    // Método para eliminar la asociación de un votante a una votación
    public function eliminarVotante()
    {
        $this->checkAuth();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['votacion_id']) || empty($input['votante_id'])) {
            $this->sendError("Parámetros insuficientes");
        }

        $votacion_id = $input['votacion_id'];
        $votante_id = $input['votante_id'];

        $result = $this->db->removeVotanteFromVotacion($votacion_id, $votante_id);

        if ($result) {
            $this->sendResponse(['success' => true, 'message' => 'Votante eliminado de la votación']);
        } else {
            $this->sendError("Error al eliminar votante de la votación");
        }
    }
    public function importarCenso()
    {
        $this->checkAuth();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendError("Método no permitido", 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['votacion_id'])) {
            $this->sendError("Votación no identificada");
        }
        if (empty($input['voters']) || !is_array($input['voters'])) {
            $this->sendError("No se proporcionaron los datos del CSV");
        }

        $votacion_id = $input['votacion_id'];
        $nuevos = [];
        foreach ($input['voters'] as $v) {
            // Validar que existan las columnas requeridas
            if (empty($v['nombre']) || empty($v['apellidos']) || empty($v['email'])) {
                continue; // omitir líneas incompletas
            }
            $nombre = trim($v['nombre']);
            $apellidos = trim($v['apellidos']);
            $email = trim($v['email']);

            // Buscar si ya existe el votante por email
            $votante = $this->db->getVotanteByEmail($email);
            if ($votante) {
                // Actualizamos la información del votante
                $this->db->updateVotante($votante['id'], $nombre, $apellidos, $email);
                $votante_id = $votante['id'];
            } else {
                // Creamos el votante
                $votante_id = $this->db->addVotante($nombre, $apellidos, $email);
                if (!$votante_id) {
                    continue;
                }
            }
            // Agregar la asociación en la tabla censo
            // Si el votante ya estaba en la votación, se devuelve false
            $censoAdded = $this->db->addCensoEntry($votacion_id, $votante_id);
            if ($censoAdded === false) {
                continue; // Si ya existe, se omite
            }
            // Agregamos a la lista de nuevos para enviar de respuesta
            $nuevos[] = [
                'votante_id' => $votante_id,
                'nombre' => $nombre,
                'apellidos' => $apellidos,
                'email' => $email
            ];
        }

        $this->sendResponse(['success' => true, 'message' => 'CSV importado correctamente', 'nuevos' => $nuevos]);
    }

    // Vista previa de los datos de la votación
    public function datosVistaPrevia()
    {
        $this->checkAuth();

        // Obtiene el id de la votación vía GET, en lugar de la sesión
        if (empty($_GET['votacion_id'])) {
            $this->sendError("Votación no identificada", 400);
        }
        $votacion_id = $_GET['votacion_id'];

        $votacion = $this->db->getVotacionById($votacion_id);
        if (!$votacion) {
            $this->sendError("Votación no encontrada", 404);
        }

        $candidatos = $this->db->getCandidatosByVotacion($votacion_id);

        $data = [
            'votacion' => [
                'id' => $votacion['id'],
                'nombre' => $votacion['nombre'],
                'votoNulo' => (bool) $votacion['votoNulo'],
                'votoBlanco' => (bool) $votacion['votoBlanco']
            ],
            'candidatos' => $candidatos
        ];
        $this->sendResponse($data);
    }


}
?>