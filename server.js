const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/analyze', (req, res) => {
    const { code } = req.body;
    if (code === undefined) {
        return res.status(400).json({ error: 'No code provided.' });
    }

    try {
        fs.writeFileSync('inputsample.c', code, 'utf8');

        // Execute lex.exe
        exec('lex.exe', (lexError, lexStdout, lexStderr) => {
            if (lexError) {
                return res.status(500).json({ error: 'Lexical analysis failed', details: lexStderr || lexError.message });
            }

            // Read token.txt to return it
            let tokensRaw = '';
            try {
                if (fs.existsSync('token.txt')) {
                    tokensRaw = fs.readFileSync('token.txt', 'utf8');
                }
            } catch (err) { }

            // Execute parser.exe
            exec('parser.exe', (parserError, parserStdout, parserStderr) => {
                // If syntax error occurs, parser.exe might exit with 1 and trigger parserError
                // We'll capture both stdout and stderr because it prints error on stdout before exit(1).
                
                let syntaxResult = '';
                let symbolTabRaw = '';
                
                const output = parserStdout + (parserStderr || '');

                if (output.includes('Syntax Error')) {
                    const match = output.match(/Syntax Error.*/);
                    if (match) {
                        syntaxResult = match[0];
                    } else {
                        syntaxResult = 'Syntax Error Detected.';
                    }
                } else if (output.includes('Syntax is valid')) {
                    syntaxResult = 'Syntax is valid';
                }

                if (output.includes('SYMBOL TABLE')) {
                    const idx = output.indexOf('SYMBOL TABLE');
                    symbolTabRaw = output.substring(idx);
                }

                // If parserError && no syntaxResult was extracted, fallback
                if (parserError && !syntaxResult) {
                    syntaxResult = 'Compilation Error: ' + (parserStderr || parserError.message);
                }

                return res.json({
                    success: true,
                    tokens: tokensRaw,
                    syntaxResult: syntaxResult || "No syntax output.",
                    symbolTableFullOutput: symbolTabRaw
                });
            });
        });
    } catch (e) {
        return res.status(500).json({ error: 'Server exception', details: e.message });
    }
});

app.post('/api/dfa', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
        return res.status(400).json({ error: 'No identifier provided' });
    }
    
    // In Windows cmd, `echo word| dfa.exe` pipes the word.
    // Note: ensure no trailing spaces in echo.
    const command = `echo ${identifier}| dfa.exe`;
    
    exec(command, (error, stdout, stderr) => {
        let result = stdout || stderr || '';
        // dfa.c outputs "Enter identifier: Valid Identifier" etc
        const isValid = result.includes('Valid Identifier');
        const isInvalid = result.includes('Invalid Identifier');
        let status = 'Unknown';
        
        if (isValid) status = 'Valid Identifier';
        else if (isInvalid) status = 'Invalid Identifier';
        
        res.json({ status });
    });
});

app.listen(PORT, () => {
    console.log(`LexiCore toolkit server is running at http://localhost:${PORT}`);
});
