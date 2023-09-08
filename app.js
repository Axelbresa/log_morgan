const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require("dotenv").config();

const {sequelize}=require("./database/db");

const consolaDirectory = path.join(__dirname, 'consola');

// Verifica si la carpeta "consola" existe, y si no, la crea
if (!fs.existsSync(consolaDirectory)) {
  fs.mkdirSync(consolaDirectory);
}

// Ruta al archivo de registro personalizado (text.log) dentro de la carpeta "consola"
const logFile = path.join(consolaDirectory, 'text.log');

// // Redirigir la salida estándar a un archivo de registro
 const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Reemplazar la salida estándar (stdout) con el flujo de registro
// Función personalizada para redirigir mensajes de registro
function logToCustomFile(message) {
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  const logMessage = `[${formattedDate}] ${message}\n`;
  logStream.write(logMessage);
  process.stdout.write(logMessage); // También muestra el mensaje en la consola
}

// Redirige console.log a la función personalizada
console.log = function (message) {
  logToCustomFile(message);
};

// Redirige info a la función personalizada
console.info = function (message) {
  logToCustomFile(`INFO: ${message}`);
};

// Redirige alert a la función personalizada
alert = function (message) {
  logToCustomFile(`alert: ${message}`);
};

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verifica si la carpeta LOG_MORGAN existe, y si no, la crea
const logDirectory = path.join(__dirname, 'log_morgan');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Crea un archivo de registro (logger) utilizando Morgan para rutas correctas
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'ruta_correcta.log'), { flags: 'a' });

// Configura Morgan para usar el archivo de registro personalizado para rutas correctas
app.use(morgan('combined', { stream: accessLogStream }));

// Middleware para registrar un mensaje personalizado en la ruta principal
app.use('/', (req, res, next) => {
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  const message = `Se conectó con éxito a la ruta principal el ${formattedDate}\n`;
  accessLogStream.write(message);
  next();
});

// Middleware para manejar errores de acceso a la ruta en un archivo separado
app.use((req, res, next) => {
  // Simula un error aquí si no se puede acceder a la ruta
  // Por ejemplo, puedes verificar alguna condición y lanzar un error si no se cumple.
  const accesoExitoso = true; // Cambia esto según tus necesidades
  if (!accesoExitoso) {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const errorMessage = `No se pudo conectar a la página el ${formattedDate}\n`;

    // Registra el mensaje de error personalizado en el archivo de registro de errores de ruta
    const errorLogStream = fs.createWriteStream(path.join(logDirectory, 'error_ruta.log'), { flags: 'a' });
    errorLogStream.write(errorMessage);
    errorLogStream.end(); // Cierra el archivo después de escribir

    const error = new Error('No se pudo acceder a la ruta');
    next(error);
  } else {
    next();
  }
});

// Middleware para manejar errores y registrarlos en el archivo de registro de errores de ruta
app.use((err, req, res, next) => {
  console.error(err); // Muestra el error en la consola
  // Registra el error en el archivo de registro de errores de ruta
  const errorLogStream = fs.createWriteStream(path.join(logDirectory, 'error_ruta.log'), { flags: 'a' });
  errorLogStream.write(`Error en la ruta: ${err.message}\n`);
  errorLogStream.end(); // Cierra el archivo después de escribir
  res.status(500).send('Ocurrió un error en el servidor');
});

// Rutas de ejemplo
app.get('/', (req, res) => {
  res.send('Hola, Mundo!');
});

 //conexion a la base de datos
 sequelize
   .authenticate()
   .then(async () => {
     await sequelize.sync({ alter: true })
     console.log("nos hemos conectado a la base de datos");
   })
   .catch((error) => {
     console.log("se ha producido un error", error);
   });

app.listen(port, () => {
  console.log(`El servidor está funcionando en el puerto ${port}`);
});

//mensaje
  //console.log("estoy usando console.log mejor estructurado");
//  console.info("estoy usando info mejor estructurado");
//alert("estoy usando alert mejor estructurado");


