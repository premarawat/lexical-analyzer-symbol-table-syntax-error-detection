const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const workspaceDir = __dirname;
const inputSamplePath = path.join(workspaceDir, 'inputsample.c');
const tokenPath = path.join(workspaceDir, 'token.txt');

// ================= SAVE CODE =================
app.post('/api/save', (req, res) => {
const { code } = req.body;
try {
fs.writeFileSync(inputSamplePath, code || '');
res.json({ success: true });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

// ================= RUN COMPILER =================
app.post('/api/analyze', (req, res) => {
console.log("Starting Compiler Pipeline...");

const { code } = req.body;
try {
    fs.writeFileSync(inputSamplePath, code || '');
} catch (err) {
    return res.status(500).json({ error: "Failed to save code: " + err.message });
}

try {
    if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
} catch (e) {}

const compileLex = process.platform === 'win32'
    ? 'gcc lex.c -o lex.exe'
    : 'gcc lex.c -o lex';

const runLex = process.platform === 'win32'
    ? '.\\lex.exe'
    : './lex';

const compileParser = process.platform === 'win32'
    ? 'gcc parser.c -o parser.exe'
    : 'gcc parser.c -o parser';

const runParser = process.platform === 'win32'
    ? '.\\parser.exe'
    : './parser';

// STEP 1: Compile Lexer
exec(compileLex, { cwd: workspaceDir }, (err) => {
    if (err) {
        console.error("Lexer Compile Error:", err);
        return res.json({ error: "Lexer compilation failed" });
    }

    console.log("Running Lexer:", runLex);

    // STEP 2: Run Lexer
    exec(runLex, { cwd: workspaceDir }, (errLex, stdoutLex, stderrLex) => {

    console.log("LEXER OUTPUT:", stdoutLex);
    console.log("LEXER ERROR:", stderrLex);

    if (errLex) {
        console.error("Lexer Run Error:", errLex);
        return res.json({ error: "Lexer execution failed" });
    }

        let tokens = [];

        try {
            if (fs.existsSync(tokenPath)) {
                const content = fs.readFileSync(tokenPath, 'utf8');

                tokens = content
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => {
                        const parts = line.split(' ');
                        const type = parts[0];
                        const lineNo = parts.pop();
                        const value = parts.slice(1).join(' ');
                        return { type, value, line: lineNo };
                    });
            }
        } catch (e) {
            console.error("Token Read Error:", e);
        }

        console.log("Compiling Parser...");

        // STEP 3: Compile Parser
        exec(compileParser, { cwd: workspaceDir }, (errParserCompile) => {
            if (errParserCompile) {
                console.error("Parser Compile Error:", errParserCompile);
                return res.json({ error: "Parser compilation failed" });
            }

            console.log("Running Parser:", runParser);

            // STEP 4: Run Parser
            exec(runParser, { cwd: workspaceDir }, (errParser, stdoutParser, stderrParser) => {

                const fullOutput = (stdoutParser + "\n" + stderrParser).trim();
                const lines = fullOutput.split('\n');

                const errors = lines.filter(line =>
                    line.toLowerCase().includes('error') ||
                    line.toLowerCase().includes('invalid')
                );

                res.json({
                    tokens: tokens.map(t => `${t.type} ${t.value} ${t.line}`).join('\n'),
                    syntaxResult: errors.length > 0 ? errors.join(' | ') : "Syntax is valid",
                    symbolTableFullOutput: fullOutput,
                    errors,
                    rawParserOutput: fullOutput
                });
            });
        });
    });
});

});

// ================= DFA VALIDATION =================
app.post('/api/dfa', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.json({ status: "Invalid Identifier" });

    const dfaPath = path.join(workspaceDir, 'dfa.c');
    const compileDfa = process.platform === 'win32' ? 'gcc dfa.c -o dfa.exe' : 'gcc dfa.c -o dfa';
    const runDfa = process.platform === 'win32' ? '.\\dfa.exe' : './dfa';

    if (fs.existsSync(dfaPath)) {
        exec(compileDfa, { cwd: workspaceDir }, (err) => {
            if (err) return res.json({ status: "Error compiling DFA" });
            const child = exec(runDfa, { cwd: workspaceDir }, (errRun, stdout) => {
                if (stdout.toLowerCase().includes('invalid')) {
                    res.json({ status: "Invalid Identifier" });
                } else {
                    res.json({ status: "Valid Identifier" });
                }
            });
            child.stdin.write(identifier + '\n');
            child.stdin.end();
        });
    } else {
        // Fallback Javascript DFA if dfa.c is missing or to avoid compilation overhead
        const isValid = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
        res.json({ status: isValid ? "Valid Identifier" : "Invalid Identifier" });
    }
});

// ================= GENERATE PARSE TREE =================
app.get('/api/generate_tree', (req, res) => {
    const compileTree = process.platform === 'win32'
        ? 'gcc tree_parser.c -o tree_parser.exe'
        : 'gcc tree_parser.c -o tree_parser';

    const runTree = process.platform === 'win32'
        ? '.\\tree_parser.exe'
        : './tree_parser';

    exec(compileTree, { cwd: workspaceDir }, (err) => {
        if (err) {
            console.error("Tree parser compile error:", err);
            return res.json({ error: "Tree parser compilation failed" });
        }
        exec(runTree, { cwd: workspaceDir }, (errTree, stdoutTree) => {
            if (errTree) {
                console.error("Tree parser run error:", errTree);
                return res.json({ error: "Tree parser execution failed" });
            }
            try {
                const treeJson = JSON.parse(stdoutTree);
                res.json(treeJson);
            } catch(e) {
                res.json({ error: "Failed to parse tree output. Raw: " + stdoutTree });
            }
        });
    });
});

// ================= START SERVER =================
app.listen(PORT, () => {
console.log(`Server running at http://localhost:${PORT}`);
});
