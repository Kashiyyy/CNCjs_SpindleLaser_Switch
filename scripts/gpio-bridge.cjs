const http = require('http');
const { execFile } = require('child_process');
const url = require('url');

const PORT = 8008;
const SCRIPT_PATH = '/home/pi/scripts/gpio-set.sh';

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const queryObject = url.parse(req.url, true).query;
    const pin = queryObject.pin;
    const state = queryObject.state;

    // VALIDATION: Ensure pin is a number and state is exactly 'on' or 'off'
    const pinNumber = parseInt(pin, 10);
    if (isNaN(pinNumber) || pinNumber < 0 || pinNumber > 40) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or missing pin parameter (must be 0-40)' }));
        return;
    }

    if (state !== 'on' && state !== 'off') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or missing state parameter (must be on or off)' }));
        return;
    }

    // Use execFile to pass arguments safely as an array
    console.log(`[${new Date().toISOString()}] Executing: ${SCRIPT_PATH} ${pinNumber} ${state}`);

    execFile(SCRIPT_PATH, [String(pinNumber), state], (error, stdout, stderr) => {
        const fullOutput = stdout + stderr;
        console.log(fullOutput.trim());

        if (error) {
            console.error(`Error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: error.message,
                details: fullOutput.trim()
            }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Success',
            output: fullOutput.trim()
        }));
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`GPIO Bridge listening on http://0.0.0.0:${PORT}`);
    console.log(`Using script: ${SCRIPT_PATH}`);
});
