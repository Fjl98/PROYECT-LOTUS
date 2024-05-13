/* --------------------ME DA TODOS LAS URL PERO SER PASA -----------------------
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const express = require('express');

const app = express();

async function buscarPalabraEnPagina(url, palabra) {
    try {
        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const texto = dom.window.document.body.textContent.toLowerCase();
        const coincidencias = (texto.match(new RegExp(palabra, 'g')) || []).length;
        return coincidencias;
    } catch (error) {
        console.error('Error al obtener el contenido de la página:', error.message);
        return 0;
    }
}

async function buscarEnlacesRecursivo(url, palabra, profundidadMaxima, profundidadActual = 0) {
    try {
        if (profundidadActual > profundidadMaxima) {
            return;
        }

        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const enlaces = dom.window.document.querySelectorAll('a');

        const baseDomain = new URL(url).hostname;

        let resultados = [];

        for (const enlace of enlaces) {
            const href = enlace.href;
            try {
                // Imprime la URL para verificar si hay problemas con el formato
                console.log('URL:', href);
                const parsedUrl = new URL(href);
                if (parsedUrl.hostname === baseDomain) {
                    const coincidencias = await buscarPalabraEnPagina(href, palabra);
                    resultados.push({ url: href, coincidencias });
                    await buscarEnlacesRecursivo(href, palabra, profundidadMaxima, profundidadActual + 1);
                }
            } catch (error) {
                console.error('Error al analizar enlace:', error.message);
            }
        }

        return resultados;
    } catch (error) {
        console.error('Error al obtener el contenido de la página:', error.message);
        return [];
    }
}

async function generarHTML(resultados) {
    const tablaHTML = resultados.map(resultado => {
        return `<tr>
                    <td>${resultado.url}</td>
                    <td>${resultado.coincidencias}</td>
                </tr>`;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resultados de búsqueda</title>
            <style>
                table {
                    font-family: Arial, sans-serif;
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #dddddd;
                    text-align: left;
                    padding: 8px;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h2>Resultados de búsqueda</h2>
            <table>
                <tr>
                    <th>URL</th>
                    <th>Coicidencias</th>
                </tr>
                ${tablaHTML}
            </table>
        </body>
        </html>
    `;

    const nombreArchivo = 'resultados_busqueda.html';
    const rutaArchivo = path.join(__dirname, nombreArchivo);
    fs.writeFileSync(rutaArchivo, html);
    console.log(`Archivo HTML generado: ${rutaArchivo}`);
    return rutaArchivo;
}

async function mostrarResultadosEnServidor(url, palabra, profundidadMaxima) {
    try {
        const resultados = await buscarEnlacesRecursivo(url, palabra, profundidadMaxima);
        if (resultados.length > 0) {
            const rutaArchivoHTML = await generarHTML(resultados);
            app.get('/', function(req, res) {
                res.sendFile(rutaArchivoHTML);
            });
            app.listen(3000, function() {
                console.log('Servidor Express escuchando en el puerto 3000...');
            });
        } else {
            console.log('No se encontraron resultados.');
        }
    } catch (error) {
        console.error('Error al buscar enlaces:', error.message);
    }
}

// Ejemplo de uso
const palabra = 'lotus';
const url = 'https://www.bonviveur.es/';
const profundidadMaxima = 2; // Profundidad máxima de búsqueda

mostrarResultadosEnServidor(url, palabra, profundidadMaxima);
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const express = require('express');

const app = express();

async function buscarPalabraEnPagina(url, palabra) {
    try {
        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const texto = dom.window.document.body.textContent.toLowerCase();
        const coincidencias = (texto.match(new RegExp(palabra, 'g')) || []).length;
        return coincidencias;
    } catch (error) {
        console.error('Error al obtener el contenido de la página:', error.message);
        return 0;
    }
}

async function buscarEnlacesRecursivo(url, palabra, profundidadMaxima, profundidadActual = 0, urlsVisitadas = new Set()) {
    try {
        if (profundidadActual > profundidadMaxima || urlsVisitadas.has(url)) {
            return [];
        }

        urlsVisitadas.add(url);

        const response = await axios.get(url);
        const dom = new JSDOM(response.data);
        const texto = dom.window.document.body.textContent.toLowerCase();

        // Verificar si la palabra clave está en el texto de la página
        if (texto.includes(palabra)) {
            return [{ url, coincidencias: 1 }]; // Si la palabra clave está presente, agregar la URL
        }

        // Si la palabra clave no está en el texto, continuar buscando enlaces
        const enlaces = dom.window.document.querySelectorAll('a');

        const baseDomain = new URL(url).hostname;

        let resultados = [];

        for (const enlace of enlaces) {
            const href = enlace.href;
            try {
                const parsedUrl = new URL(href);
                // Validar si la URL es válida antes de continuar
                if (parsedUrl.protocol && parsedUrl.hostname && parsedUrl.pathname) {
                    if (parsedUrl.hostname === baseDomain) {
                        // Continuar buscando enlaces recursivamente
                        const enlaceResultados = await buscarEnlacesRecursivo(href, palabra, profundidadMaxima, profundidadActual + 1, urlsVisitadas);
                        resultados.push(...enlaceResultados);
                    }
                } else {
                    console.error('Error al analizar enlace:', 'URL no válida:', href);
                }
            } catch (error) {
                console.error('Error al analizar enlace:', error.message);
            }
        }

        return resultados;
    } catch (error) {
        console.error('Error al obtener el contenido de la página:', error.message);
        return [];
    }
}

async function generarHTML(resultados) {
    const tablaHTML = resultados.map(resultado => {
        const coincidePalabra = resultado.coincidencias > 0 ? 'Sí' : 'No';
        return `<tr>
                    <td>${resultado.url}</td>
                    <td>${coincidePalabra}</td>
                </tr>`;
    }).join('');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resultados de búsqueda</title>
            <style>
                table {
                    font-family: Arial, sans-serif;
                    border-collapse: collapse;
                    width: 100%;
                }
                th, td {
                    border: 1px solid #dddddd;
                    text-align: left;
                    padding: 8px;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h2>Resultados de búsqueda</h2>
            <table>
                <tr>
                    <th>URL</th>
                    <th>Palabra presente</th>
                </tr>
                ${tablaHTML}
            </table>
        </body>
        </html>
    `;

    const nombreArchivo = 'resultados_busqueda.html';
    const rutaArchivo = path.join(__dirname, nombreArchivo);
    fs.writeFileSync(rutaArchivo, html);
    console.log(`Archivo HTML generado: ${rutaArchivo}`);
    return rutaArchivo;
}

async function mostrarResultadosEnServidor(url, palabra, profundidadMaxima) {
    try {
        const resultados = await buscarEnlacesRecursivo(url, palabra, profundidadMaxima);
        if (resultados.length > 0) {
            const rutaArchivoHTML = await generarHTML(resultados);
            app.get('/', function(req, res) {
                res.sendFile(rutaArchivoHTML);
            });
            app.listen(3000, function() {
                console.log('Servidor Express escuchando en el puerto 3000...');
                const { exec } = require('child_process');
                exec(`start http://localhost:3000`);
            });
        } else {
            console.log('No se encontraron resultados.');
        }
    } catch (error) {
        console.error('Error al buscar enlaces:', error.message);
    }
}

// Ejemplo de uso
const palabra = 'hdhfgf';
const url = 'https://www.directoalpaladar.com/';
const profundidadMaxima = 2; // Profundidad máxima de búsqueda

mostrarResultadosEnServidor(url, palabra, profundidadMaxima);
