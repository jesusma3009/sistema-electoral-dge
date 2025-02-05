<?php
class Database
{
    protected $db;

    public function __construct()
    {
        $dsn = 'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_DATABASE'];
        $username = $_ENV['DB_USERNAME'];
        $password = $_ENV['DB_PASSWORD'];
        try {
            $this->db = new PDO($dsn, $username, $password);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            throw new Exception("Error al conectar a la base de datos: " . $e->getMessage());
        }
    }
}

class VotingDB extends Database
{
    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA votaciones
    –––––––––––––––––––––––––––––––––––––*/

    // Obtener todas las votaciones (por ejemplo, para el listado del panel de administración)
    public function getAllVotaciones()
    {
        $sql = "SELECT * FROM votaciones ORDER BY fecha_creacion DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Obtener una votación concreta por id
    public function getVotacionById($id)
    {
        $sql = "SELECT * FROM votaciones WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Crear una nueva votación (por ejemplo, se invoca desde el flujo "Nueva Votación")
    public function createVotacion($nombre, $descripcion, $tipo, $clave_publica, $fecha_inicio = null, $fecha_fin = null, $votoNulo = 0, $votoBlanco = 0)
    {
        $sql = "INSERT INTO votaciones (nombre, descripcion, tipo, clave_publica, fecha_inicio, fecha_fin, votoNulo, votoBlanco)
                VALUES (:nombre, :descripcion, :tipo, :clave_publica, :fecha_inicio, :fecha_fin, :votoNulo, :votoBlanco)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':descripcion' => $descripcion,
            ':tipo' => $tipo,
            ':clave_publica' => $clave_publica,
            ':fecha_inicio' => $fecha_inicio,
            ':fecha_fin' => $fecha_fin,
            ':votoNulo' => $votoNulo,
            ':votoBlanco' => $votoBlanco
        ]);
        return $this->db->lastInsertId();
    }

    // Actualizar los datos principales y la configuración de una votación
    public function updateVotacion($id, $nombre, $descripcion, $fecha_inicio, $fecha_fin, $votoNulo, $votoBlanco)
    {
        $sql = "UPDATE votaciones 
                SET nombre = :nombre, descripcion = :descripcion, fecha_inicio = :fecha_inicio, fecha_fin = :fecha_fin, votoNulo = :votoNulo, votoBlanco = :votoBlanco
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':nombre' => $nombre,
            ':descripcion' => $descripcion,
            ':fecha_inicio' => $fecha_inicio,
            ':fecha_fin' => $fecha_fin,
            ':votoNulo' => $votoNulo,
            ':votoBlanco' => $votoBlanco,
            ':id' => $id
        ]);
    }

    // Eliminar una votación
    public function deleteVotacion($id)
    {
        $sql = "DELETE FROM votaciones WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }


    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA candidatos
    –––––––––––––––––––––––––––––––––––––*/

    // Obtener los candidatos de una votación ordenados por el campo "orden"
    public function getCandidatosByVotacion($votacion_id)
    {
        $sql = "SELECT * FROM candidatos WHERE votacion_id = :votacion_id ORDER BY orden ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':votacion_id' => $votacion_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Agregar un candidato a una votación
    public function addCandidato($votacion_id, $nombre, $orden = 0)
    {
        $sql = "INSERT INTO candidatos (votacion_id, nombre, orden) VALUES (:votacion_id, :nombre, :orden)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':votacion_id' => $votacion_id,
            ':nombre' => $nombre,
            ':orden' => $orden
        ]);
        return $this->db->lastInsertId();
    }

    public function getCandidatoById($id)
    {
        $sql = "SELECT * FROM candidatos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Actualizar datos de un candidato (por ejemplo, tras reordenar o editar el nombre)
    public function updateCandidato($id, $nombre, $orden)
    {
        $sql = "UPDATE candidatos SET nombre = :nombre, orden = :orden WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':nombre' => $nombre,
            ':orden' => $orden,
            ':id' => $id
        ]);
    }

    // Eliminar un candidato
    public function deleteCandidato($id)
    {
        $sql = "DELETE FROM candidatos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }


    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA votantes
    –––––––––––––––––––––––––––––––––––––*/

    // Agregar un votante. Se asume que el email es único.
    // Si el votante ya existe (por email), se devuelve su id.
    public function addVotante($nombre, $apellidos, $email)
    {
        $sql = "INSERT INTO votantes (nombre, apellidos, email) VALUES (:nombre, :apellidos, :email)";
        $stmt = $this->db->prepare($sql);
        try {
            $stmt->execute([
                ':nombre' => $nombre,
                ':apellidos' => $apellidos,
                ':email' => $email
            ]);
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            // En caso de duplicado (violación de UNIQUE), se obtiene el id existente
            if ($e->getCode() == 23000) {
                $sql = "SELECT id FROM votantes WHERE email = :email";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([':email' => $email]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                return $result ? $result['id'] : false;
            } else {
                throw $e;
            }
        }
    }


    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA censo
    –––––––––––––––––––––––––––––––––––––*/

    // Agregar una entrada al censo, relacionando un votante con una votación.
    // Notar que si ya existe (gracias a la UNIQUE KEY) se puede retornar false o gestionar error.
    public function addCensoEntry($votacion_id, $votante_id)
    {
        $sql = "INSERT INTO censo (votacion_id, votante_id) VALUES (:votacion_id, :votante_id)";
        $stmt = $this->db->prepare($sql);
        try {
            return $stmt->execute([
                ':votacion_id' => $votacion_id,
                ':votante_id' => $votante_id
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                // Ya existe en el censo para esa votación.
                return false;
            } else {
                throw $e;
            }
        }
    }

    // Obtener el listado de votantes (censo) para una votación dada, incluyendo datos personales
    public function getCensoByVotacion($votacion_id)
    {
        $sql = "SELECT c.id, v.nombre, v.apellidos, v.email, c.ha_votado 
                FROM censo c
                JOIN votantes v ON c.votante_id = v.id
                WHERE c.votacion_id = :votacion_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':votacion_id' => $votacion_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Marcar que un votante ha emitido su voto (actualizando ha_votado en la tabla censo)
    public function markVotado($votacion_id, $votante_id)
    {
        $sql = "UPDATE censo SET ha_votado = 1 WHERE votacion_id = :votacion_id AND votante_id = :votante_id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':votacion_id' => $votacion_id,
            ':votante_id' => $votante_id
        ]);
    }


    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA votos
    –––––––––––––––––––––––––––––––––––––*/

    // Registrar un voto (se guarda el voto cifrado y su hash)
    public function addVoto($votacion_id, $voto_cifrado, $voto_hash)
    {
        $sql = "INSERT INTO votos (votacion_id, voto_cifrado, voto_hash) 
                VALUES (:votacion_id, :voto_cifrado, :voto_hash)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':votacion_id' => $votacion_id,
            ':voto_cifrado' => $voto_cifrado,
            ':voto_hash' => $voto_hash
        ]);
        return $this->db->lastInsertId();
    }


    /*–––––––––––––––––––––––––––––––––––
      OPERACIONES SOBRE LA TABLA logs
    –––––––––––––––––––––––––––––––––––––*/

    // Insertar un registro en la tabla de logs para eventos de autenticación, votación, errores, etc.
    public function insertLog($event_type, $event_details, $ip_address = null, $user_agent = null)
    {
        if (isset($_SERVER['REMOTE_ADDR']) && $ip_address == null){
            $ip_address = $_SERVER['REMOTE_ADDR'];
        }
        if (isset($_SERVER['HTTP_USER_AGENT']) && $user_agent == null){
            $user_agent = $_SERVER['HTTP_USER_AGENT'];
        }
        $sql = "INSERT INTO logs (event_type, event_details, ip_address, user_agent) 
                VALUES (:event_type, :event_details, :ip_address, :user_agent)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':event_type' => $event_type,
            ':event_details' => $event_details,
            ':ip_address' => $ip_address,
            ':user_agent' => $user_agent
        ]);
        return $this->db->lastInsertId();
    }
}