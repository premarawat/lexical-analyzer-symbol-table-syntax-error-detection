document.addEventListener('DOMContentLoaded', () => {
    
    // --- Elements ---
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    
    const dfaInput = document.getElementById('dfa-input');
    const dfaTestBtn = document.getElementById('dfa-test-btn');
    const dfaResult = document.getElementById('dfa-result');
    
    const runBtn = document.getElementById('run-btn');
    const syntaxStatus = document.getElementById('syntax-status');
    const tokensTable = document.getElementById('tokens-table');
    const tokensTableBody = document.getElementById('tokens-table-body');
    const tokensPlaceholder = document.getElementById('tokens-placeholder');
    
    const symbolTable = document.getElementById('symbol-table');
    const symbolTableBody = document.getElementById('symbol-table-body');
    const tablePlaceholder = document.getElementById('table-placeholder');
    
    const themeToggle = document.getElementById('theme-toggle');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    
    const historyBtn = document.getElementById('history-btn');
    const historyMenu = document.getElementById('history-menu');
    const historyList = document.getElementById('history-list');

    // State to hold raw data for the report
    let lastAnalysisData = null;

    // --- 1. Code Editor Line Number Sync ---
    const updateLineNumbers = () => {
        const lines = codeEditor.value.split('\n').length;
        let numbersHtml = '';
        for (let i = 1; i <= lines; i++) {
            numbersHtml += i + '<br>';
        }
        lineNumbers.innerHTML = numbersHtml;
    };

    codeEditor.addEventListener('input', updateLineNumbers);
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    // Default Code Setup
    const defaultCode = `#include <stdio.h>\nint main() {\n    int a = 10;\n    int b = 20;\n    int sum = a + b;\n    return 0;\n}`;
    codeEditor.value = defaultCode;
    updateLineNumbers();

    // --- 2. Theme Toggle ---
    themeToggle.addEventListener('click', () => {
        const body = document.getElementById('body');
        const isLight = body.classList.contains('light-mode');
        
        if (isLight) {
            body.classList.remove('light-mode');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            body.classList.add('light-mode');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    });

    // --- 3. History Management ---
    let codeHistory = JSON.parse(localStorage.getItem('lexicore_history') || '[]');
    
    const saveToHistory = (code) => {
        // don't save duplicates in a row
        if (codeHistory.length > 0 && codeHistory[0].code === code) return;
        
        const entry = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            code: code,
            snippet: code.substring(0, 30).replace(/\n/g, ' ') + '...'
        };
        codeHistory.unshift(entry);
        
        // Keep last 3
        if (codeHistory.length > 3) {
            codeHistory.pop();
        }
        localStorage.setItem('lexicore_history', JSON.stringify(codeHistory));
        renderHistory();
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        if (codeHistory.length === 0) {
            historyList.innerHTML = '<li style="color:var(--text-secondary); text-align:center;">No history yet</li>';
            return;
        }

        codeHistory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="history-time"><i class="fa-regular fa-clock"></i> ${item.time}</span>
                <span class="history-snippet">${item.snippet}</span>
            `;
            li.addEventListener('click', () => {
                codeEditor.value = item.code;
                updateLineNumbers();
                historyMenu.classList.add('hidden');
            });
            historyList.appendChild(li);
        });
    };

    historyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        historyMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        historyMenu.classList.add('hidden');
    });
    
    renderHistory();

    // --- 4. DFA Validation ---
    dfaTestBtn.addEventListener('click', async () => {
        const identifier = dfaInput.value.trim();
        if(!identifier) return;

        try {
            // Loading state
            dfaTestBtn.disabled = true;
            dfaTestBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            const res = await fetch('/api/dfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            });
            const data = await res.json();
            
            dfaResult.classList.remove('hidden', 'valid', 'invalid');
            if (data.status === 'Valid Identifier') {
                dfaResult.classList.add('valid');
                dfaResult.innerHTML = '<i class="fa-solid fa-check-circle"></i> Valid Identifier';
            } else {
                dfaResult.classList.add('invalid');
                dfaResult.innerHTML = '<i class="fa-solid fa-times-circle"></i> Invalid Identifier';
            }

        } catch (e) {
            alert('Error running DFA: ' + e.message);
        } finally {
            dfaTestBtn.disabled = false;
            dfaTestBtn.innerHTML = 'Test DFA';
        }
    });

    // --- 5. Main Analysis (Lex & Parse) ---
    async function runAnalysis(isManual = false) {
        const code = codeEditor.value;
        if (!code.trim()) return;

        if (isManual) saveToHistory(code);

        try {
            if (isManual) {
                runBtn.disabled = true;
                runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
            }
            
            // reset UI
            document.getElementById('tree-modal').classList.add('hidden');
            syntaxStatus.className = 'status-box empty';
            syntaxStatus.innerText = 'Processing...';
            tokensPlaceholder.innerText = 'Processing...';
            tokensPlaceholder.classList.remove('hidden');
            tokensTable.classList.add('hidden');
            tokensTableBody.innerHTML = '';
            tablePlaceholder.classList.remove('hidden');
            symbolTable.classList.add('hidden');
            symbolTableBody.innerHTML = '';

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            
            const data = await res.json();
            lastAnalysisData = data; // Store for report generation
            
            if (data.error && !data.syntaxResult) {
                if (isManual) alert("Compilation failed: " + (data.details || data.error));
                return;
            }

            // Populate Tokens Table
            if (data.tokens && data.tokens.trim()) {
                const tokenLines = data.tokens.split('\n').filter(l => l.trim());
                tokenLines.forEach(line => {
                    const parts = line.split(' ');
                    if (parts.length >= 3) {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${parts[0]}</td>
                            <td>${parts[1]}</td>
                            <td>${parts[2]}</td>
                        `;
                        tokensTableBody.appendChild(tr);
                    }
                });
                tokensPlaceholder.classList.add('hidden');
                tokensTable.classList.remove('hidden');
            } else {
                tokensPlaceholder.innerText = "No tokens generated.";
            }
            
            // Populate Syntax
            syntaxStatus.innerText = data.syntaxResult;
            if (data.syntaxResult.includes("valid")) {
                syntaxStatus.className = 'status-box success';
                syntaxStatus.innerHTML = '<i class="fa-solid fa-check"></i> ' + data.syntaxResult;
            } else {
                syntaxStatus.className = 'status-box error';
                syntaxStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ' + data.syntaxResult;
            }

            // Populate Symbol Table
            if (data.symbolTableFullOutput) {
                const lines = data.symbolTableFullOutput.split('\n').map(l => l.trim()).filter(l => l);
                if(lines.length > 2) {
                    for(let i=2; i<lines.length; i++) {
                        const parts = lines[i].split(/\t+/);
                        if(parts.length >= 5) {
                            const tr = document.createElement('tr');
                            tr.innerHTML = `
                                <td>${parts[0]}</td>
                                <td><span style="color:var(--accent-color); font-weight:600;">${parts[1]}</span></td>
                                <td>${parts[2]}</td>
                                <td>${parts[3]}</td>
                                <td><span style="padding:2px 6px; border-radius:4px; font-size:11px; background:rgba(255,255,255,0.1);">${parts[4]}</span></td>
                            `;
                            symbolTableBody.appendChild(tr);
                        }
                    }
                    tablePlaceholder.classList.add('hidden');
                    symbolTable.classList.remove('hidden');
                } else {
                    tablePlaceholder.innerText = "Symbol Table is empty.";
                }
            } else {
                tablePlaceholder.innerText = "No symbol table data available.";
            }

        } catch (e) {
            if (isManual) alert('Network or server error: ' + e.message);
        } finally {
            if (isManual) {
                runBtn.disabled = false;
                runBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate Output';
            }
        }
    }

    runBtn.addEventListener('click', () => runAnalysis(true));

    // Setup Live Sync (Debounce)
    let debounceTimer;
    codeEditor.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            runAnalysis(false);
            // If AST is open, refresh it automatically too!
            if (!document.getElementById('tree-modal').classList.contains('hidden')) {
                treeBtn.click();
            }
        }, 500); // Wait 500ms after user stops typing
    });

    // --- 5.5 Parse Tree Generation ---
    const treeBtn = document.getElementById('tree-btn');
    const treeModal = document.getElementById('tree-modal');
    const treeContainer = document.getElementById('tree-container');

    function generateAsciiTree(node) {
        if (!node) return { lines: [], width: 0, rootX: 0 };
        
        let label = node.name || "Unknown";
        
        // Map node names to match the screenshot precisely
        if (label === 'Program') label = "[Program]";
        else if (label === 'Function') label = "[main]";
        else if (label === 'Declaration') label = "[Decl]";
        else if (label === 'Assignment') label = "[Assign (=)]";
        else if (label === 'Return') label = "[Return]";
        else if (label === '+') label = "[+]";
        else if (label === '-') label = "[-]";
        else if (label === '*') label = "[*]";
        else if (label === '/') label = "[/]";
        else if (label === '>') label = "[>]";
        else if (label === '<') label = "[<]";
        else if (label === '==') label = "[==]";
        else if (!node.children || node.children.length === 0) label = label; // Leaf nodes
        else label = `[${label}]`;

        if (!node.children || node.children.length === 0) {
            return {
                lines: [label],
                width: label.length,
                rootX: Math.floor(label.length / 2)
            };
        }

        const children = node.children.map(generateAsciiTree);
        const MARGIN = 3; // Space between children
        
        let totalWidth = 0;
        let childRoots = [];
        
        children.forEach((c, i) => {
            childRoots.push(totalWidth + c.rootX);
            totalWidth += c.width + (i < children.length - 1 ? MARGIN : 0);
        });

        const boxWidth = Math.max(label.length, totalWidth);
        
        // Center children if label is wider
        let offset = 0;
        if (boxWidth > totalWidth) {
            offset = Math.floor((boxWidth - totalWidth) / 2);
            for(let i=0; i<childRoots.length; i++) childRoots[i] += offset;
        }

        let rootX = childRoots.length === 1 
                    ? childRoots[0] 
                    : Math.floor((childRoots[0] + childRoots[childRoots.length - 1]) / 2);

        let lines = [];
        
        // 1. Label line
        let labelLine = " ".repeat(boxWidth).split('');
        let labelStart = rootX - Math.floor(label.length / 2);
        if (labelStart < 0) labelStart = 0;
        for (let i = 0; i < label.length; i++) {
            labelLine[labelStart + i] = label[i];
        }
        lines.push(labelLine.join(''));

        // 2. Connectors
        if (children.length === 1) {
            let cl = " ".repeat(boxWidth).split('');
            cl[rootX] = '|';
            lines.push(cl.join(''));
        } else if (children.length === 2) {
            let cl1 = " ".repeat(boxWidth).split('');
            cl1[rootX - 1] = '/';
            cl1[rootX + 1] = '\\';
            lines.push(cl1.join(''));
        } else {
            let cl1 = " ".repeat(boxWidth).split('');
            cl1[rootX] = '|';
            lines.push(cl1.join(''));
            
            let cl2 = " ".repeat(boxWidth).split('');
            for (let i = childRoots[0]; i <= childRoots[childRoots.length - 1]; i++) {
                cl2[i] = '-';
            }
            cl2[rootX] = '|'; // Junction
            lines.push(cl2.join(''));
            
            let cl3 = " ".repeat(boxWidth).split('');
            childRoots.forEach(cx => {
                cl3[cx] = '|';
            });
            lines.push(cl3.join(''));
        }

        // 3. Merge children lines
        let maxLines = Math.max(...children.map(c => c.lines.length));
        for (let i = 0; i < maxLines; i++) {
            let line = "";
            let currentX = 0;
            children.forEach((c, cIdx) => {
                let spacing = (cIdx === 0 ? offset : MARGIN);
                line += " ".repeat(spacing);
                currentX += spacing;
                
                let cLine = c.lines[i] || " ".repeat(c.width);
                line += cLine;
                currentX += c.width;
            });
            if (line.length < boxWidth) line += " ".repeat(boxWidth - line.length);
            lines.push(line);
        }

        return {
            lines: lines,
            width: boxWidth,
            rootX: rootX
        };
    }

    treeBtn.addEventListener('click', async () => {
        treeModal.classList.remove('hidden');
        treeContainer.innerHTML = 'Generating...';
        
        try {
            const res = await fetch('/api/generate_tree');
            const data = await res.json();
            
            if (data.error) {
                treeContainer.innerHTML = '<span style="color:red">Error: ' + data.error + '</span>';
            } else {
                const asciiTree = generateAsciiTree(data);
                const asciiText = asciiTree.lines.join('\n');
                
                // Render as Plaintext
                treeContainer.innerHTML = `<pre style="font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; color: #f8f9fa; line-height: 1.2;">\n${asciiText}\n</pre>`;
                
                // Re-apply plaintext styles
                treeContainer.style.whiteSpace = 'pre';
                treeContainer.style.background = 'rgba(0,0,0,0.4)';
                treeContainer.style.padding = '15px';
                treeContainer.style.overflowX = 'auto';
            }
        } catch(e) {
            treeContainer.innerHTML = '<span style="color:red">Network Error: ' + e.message + '</span>';
        }
    });

    // --- 6. Professional PDF Export ---
    exportPdfBtn.addEventListener('click', () => {
        if (!lastAnalysisData && !codeEditor.value.trim()) {
            alert("No data to export. Please run analysis first.");
            return;
        }

        const reportTemplate = document.getElementById('pdf-report-template');
        const reportDate = document.getElementById('report-date');
        const reportSource = document.getElementById('report-source-code');
        const reportTokensBody = document.getElementById('report-tokens-body');
        const reportSyntax = document.getElementById('report-syntax-status');
        const reportSymbolBody = document.getElementById('report-symbol-table-body');
        const reportDfaInput = document.getElementById('report-dfa-input');
        const reportDfaResult = document.getElementById('report-dfa-result');

        // 1. Set Date
        const now = new Date();
        reportDate.innerHTML = `
            <strong>Date:</strong> ${now.toLocaleDateString()}<br>
            <strong>Time:</strong> ${now.toLocaleTimeString()}
        `;

        // 2. Format Source Code with line numbers
        const codeLines = codeEditor.value.split('\n');
        let formattedCode = '';
        codeLines.forEach((line, idx) => {
            formattedCode += `<span style="color: #888; width: 30px; display: inline-block;">${idx + 1}</span> ${line}\n`;
        });
        reportSource.innerHTML = formattedCode;

        // 3. Parse and Populate Tokens
        reportTokensBody.innerHTML = '';
        if (lastAnalysisData && lastAnalysisData.tokens) {
            const tokenLines = lastAnalysisData.tokens.split('\n').filter(l => l.trim());
            tokenLines.forEach(line => {
                const parts = line.split(' ');
                if (parts.length >= 3) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${parts[0]}</td><td>${parts[1]}</td><td>${parts[2]}</td>`;
                    reportTokensBody.appendChild(row);
                }
            });
        } else {
            reportTokensBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No tokens generated</td></tr>';
        }

        // 4. Populate Syntax Status
        const statusText = syntaxStatus.innerText || "Not analyzed";
        reportSyntax.innerText = statusText;
        reportSyntax.classList.remove('report-status-success', 'report-status-error');
        if (statusText.toLowerCase().includes('valid')) {
            reportSyntax.classList.add('report-status-success');
            reportSyntax.innerText = '✔ ' + statusText;
        } else {
            reportSyntax.classList.add('report-status-error');
            reportSyntax.innerText = '❌ ' + statusText;
        }

        // 5. Mirror Symbol Table
        reportSymbolBody.innerHTML = '';
        const uiRows = symbolTableBody.querySelectorAll('tr');
        if (uiRows.length > 0) {
            uiRows.forEach(uiRow => {
                const cells = uiRow.querySelectorAll('td');
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cells[0].innerText}</td>
                    <td>${cells[1].innerText}</td>
                    <td>${cells[2].innerText}</td>
                    <td>${cells[3].innerText}</td>
                    <td>${cells[4].innerText}</td>
                `;
                reportSymbolBody.appendChild(row);
            });
        } else {
            reportSymbolBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Symbol table is empty</td></tr>';
        }

        // 6. DFA Metadata
        reportDfaInput.innerText = dfaInput.value || "None";
        reportDfaResult.innerText = dfaResult.innerText || "Not tested";

        // 7. Generate PDF
        const opt = {
            margin:       [0.5, 0.5],
            filename:     'compiler_analysis_report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        const origHtml = exportPdfBtn.innerHTML;
        exportPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
        
        // Show template for capture (transparently)
        reportTemplate.style.display = 'block';
        
        html2pdf().set(opt).from(reportTemplate).save().then(() => {
            reportTemplate.style.display = 'none';
            exportPdfBtn.innerHTML = origHtml;
        });
    });
});
